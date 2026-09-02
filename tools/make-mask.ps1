# Builds assets/proteus-mask.png (white figure on black, 800x1124) from a line-art
# silhouette of the figure: the closed outline is flood-filled from the outside,
# then the figure's bounding box is mapped onto the figure's box in the engraving.
#
#   powershell -ExecutionPolicy Bypass -File tools\make-mask.ps1 -Silhouette C:\path\silhueta.png
#
# Target box = where the figure sits in the 800x1124 engraving (toe tip .. hand, hair .. sole).

param(
  [Parameter(Mandatory = $true)][string]$Silhouette,
  [string]$Out = "",
  [int]$X0 = 62, [int]$Y0 = 186, [int]$X1 = 718, [int]$Y1 = 1022,
  [int]$OutW = 800, [int]$OutH = 1124,
  [int]$Threshold = 140, [int]$Dilate = 2, [int]$Feather = 2,
  [double]$ShiftTop = 12, [double]$ShiftBottom = 0
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class MaskMaker {
  public static string Make(string inPath, string outPath, int tx0, int ty0, int tx1, int ty1, int outW, int outH, int threshold, int dilate, int feather, double shiftTop, double shiftBottom) {
    Bitmap src = new Bitmap(inPath);
    int w = src.Width, h = src.Height;
    byte[] px = new byte[w * h * 4];
    BitmapData bd = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    Marshal.Copy(bd.Scan0, px, 0, px.Length);
    src.UnlockBits(bd);
    src.Dispose();

    bool[] ink = new bool[w * h];
    for (int i = 0; i < w * h; i++) {
      int b = px[i * 4], g = px[i * 4 + 1], r = px[i * 4 + 2], a = px[i * 4 + 3];
      int lum = (r * 299 + g * 587 + b * 114) / 1000;
      ink[i] = a > 40 && lum < threshold;
    }
    for (int d = 0; d < dilate; d++) {
      bool[] next = (bool[])ink.Clone();
      for (int y = 1; y < h - 1; y++)
        for (int x = 1; x < w - 1; x++)
          if (ink[y * w + x]) {
            next[y * w + x - 1] = true; next[y * w + x + 1] = true;
            next[(y - 1) * w + x] = true; next[(y + 1) * w + x] = true;
          }
      ink = next;
    }

    bool[] outside = new bool[w * h];
    int[] queue = new int[w * h];
    int qh = 0, qt = 0;
    int[] seeds = { 0, w - 1, (h - 1) * w, h * w - 1 };
    foreach (int s in seeds) if (!ink[s] && !outside[s]) { outside[s] = true; queue[qt++] = s; }
    while (qh < qt) {
      int i = queue[qh++];
      int x = i % w, y = i / w;
      int[] nb = { i - 1, i + 1, i - w, i + w };
      int[] ok = { x > 0 ? 1 : 0, x < w - 1 ? 1 : 0, y > 0 ? 1 : 0, y < h - 1 ? 1 : 0 };
      for (int k = 0; k < 4; k++) {
        if (ok[k] == 0) continue;
        int j = nb[k];
        if (!ink[j] && !outside[j]) { outside[j] = true; queue[qt++] = j; }
      }
    }

    int minx = w, miny = h, maxx = -1, maxy = -1; long area = 0;
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        if (!outside[y * w + x]) {
          area++;
          if (x < minx) minx = x; if (x > maxx) maxx = x;
          if (y < miny) miny = y; if (y > maxy) maxy = y;
        }
    if (maxx < 0 || area > (long)w * h * 0.9)
      return "FAILED: outline not closed or empty (area " + area + " of " + (w * h) + ")";

    // Alpha mask (opaque inside the figure), feathered with a small box blur so the edge does not alias.
    byte[] alpha = new byte[outW * outH];
    double sx = (double)(maxx - minx + 1) / (tx1 - tx0), sy = (double)(maxy - miny + 1) / (ty1 - ty0);
    // shiftTop/shiftBottom: extra horizontal offset (output px) at the top and bottom of the target box,
    // interpolated by height — corrects a silhouette whose upper body sits off relative to its feet.
    for (int y = 0; y < outH; y++) {
      double t = Math.Max(0, Math.Min(1, (double)(y - ty0) / (ty1 - ty0)));
      double shift = shiftTop + (shiftBottom - shiftTop) * t;
      for (int x = 0; x < outW; x++) {
        int ix = (int)Math.Floor(minx + (x - shift - tx0) * sx), iy = (int)Math.Floor(miny + (y - ty0) * sy);
        bool inside = ix >= 0 && iy >= 0 && ix < w && iy < h && !outside[iy * w + ix];
        alpha[y * outW + x] = inside ? (byte)255 : (byte)0;
      }
    }
    if (feather > 0) {
      int[] tmp = new int[outW * outH];
      for (int pass = 0; pass < 2; pass++) {
        for (int y = 0; y < outH; y++)
          for (int x = 0; x < outW; x++) {
            int sum = 0, n = 0;
            for (int k = -feather; k <= feather; k++) { int xx = x + k; if (xx < 0 || xx >= outW) continue; sum += alpha[y * outW + xx]; n++; }
            tmp[y * outW + x] = sum / n;
          }
        for (int y = 0; y < outH; y++)
          for (int x = 0; x < outW; x++) {
            int sum = 0, n = 0;
            for (int k = -feather; k <= feather; k++) { int yy = y + k; if (yy < 0 || yy >= outH) continue; sum += tmp[yy * outW + x]; n++; }
            alpha[y * outW + x] = (byte)(sum / n);
          }
      }
    }
    Bitmap dst = new Bitmap(outW, outH, PixelFormat.Format32bppArgb);
    byte[] op = new byte[outW * outH * 4];
    for (int i = 0; i < outW * outH; i++) {
      op[i * 4] = 255; op[i * 4 + 1] = 255; op[i * 4 + 2] = 255; op[i * 4 + 3] = alpha[i];
    }
    BitmapData od = dst.LockBits(new Rectangle(0, 0, outW, outH), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    Marshal.Copy(op, 0, od.Scan0, op.Length);
    dst.UnlockBits(od);
    dst.Save(outPath, ImageFormat.Png);
    dst.Dispose();
    return "ok: source " + w + "x" + h + ", figure box " + minx + "," + miny + " - " + maxx + "," + maxy + " (area " + area + "), mapped to " + tx0 + "," + ty0 + " - " + tx1 + "," + ty1;
  }
}
"@

if (-not $Out) { $Out = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\assets\proteus-mask.png" }
$OutFull = [System.IO.Path]::GetFullPath($Out)
[MaskMaker]::Make((Resolve-Path $Silhouette).Path, $OutFull, $X0, $Y0, $X1, $Y1, $OutW, $OutH, $Threshold, $Dilate, $Feather, $ShiftTop, $ShiftBottom)
Write-Output ("wrote {0} ({1} bytes)" -f $OutFull, (Get-Item $OutFull).Length)
