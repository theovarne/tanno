param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Destination
)

# Extract the exterior lime field while retaining the enclosed lime details.
# This preserves the supplied pixel artwork rather than redrawing it.
Add-Type -AssemblyName System.Drawing
$drawingDir = Split-Path -Parent ([System.Drawing.Bitmap].Assembly.Location)
$drawingAssemblies = @([System.Drawing.Bitmap].Assembly.Location, [System.Drawing.Rectangle].Assembly.Location, [System.Console].Assembly.Location, [System.Runtime.InteropServices.Marshal].Assembly.Location, (Join-Path $drawingDir 'System.Private.Windows.GdiPlus.dll'), (Join-Path $drawingDir 'System.Private.Windows.Core.dll'))
Add-Type -ReferencedAssemblies $drawingAssemblies -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class SevraHeroCutout {
  static bool IsLime(byte[] bytes, int i) {
    int b = bytes[i], g = bytes[i + 1], r = bytes[i + 2];
    return g > 45 && g > r + 12 && g > b + 24;
  }

  public static void Save(string source, string destination) {
    using (var input = new Bitmap(source))
    using (var canvas = new Bitmap(input.Width, input.Height, PixelFormat.Format32bppArgb)) {
      using (var painter = Graphics.FromImage(canvas)) painter.DrawImage(input, 0, 0, input.Width, input.Height);
      int width = canvas.Width, height = canvas.Height;
      var area = new Rectangle(0, 0, width, height);
      var bits = canvas.LockBits(area, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = bits.Stride;
      var pixels = new byte[stride * height];
      Marshal.Copy(bits.Scan0, pixels, 0, pixels.Length);
      var exterior = new bool[width * height];
      var queue = new int[width * height];
      int head = 0, tail = 0;
      Action<int, int> enqueue = (x, y) => {
        int pixel = y * width + x;
        if (exterior[pixel] || !IsLime(pixels, y * stride + x * 4)) return;
        exterior[pixel] = true;
        queue[tail++] = pixel;
      };
      for (int x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
      for (int y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
      while (head < tail) {
        int pixel = queue[head++], x = pixel % width, y = pixel / width;
        if (x > 0) enqueue(x - 1, y);
        if (x + 1 < width) enqueue(x + 1, y);
        if (y > 0) enqueue(x, y - 1);
        if (y + 1 < height) enqueue(x, y + 1);
      }
      int left = width, top = height, right = -1, bottom = -1;
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          int pixel = y * width + x, offset = y * stride + x * 4;
          if (exterior[pixel]) { pixels[offset + 3] = 0; continue; }
          if (pixels[offset + 3] == 0) continue;
          left = Math.Min(left, x); top = Math.Min(top, y);
          right = Math.Max(right, x); bottom = Math.Max(bottom, y);
        }
      }
      if (right < left) throw new Exception("No foreground pixels found");
      Marshal.Copy(pixels, 0, bits.Scan0, pixels.Length);
      canvas.UnlockBits(bits);
      const int padding = 16;
      var crop = Rectangle.FromLTRB(Math.Max(0, left - padding), Math.Max(0, top - padding),
        Math.Min(width, right + padding + 1), Math.Min(height, bottom + padding + 1));
      using (var output = canvas.Clone(crop, PixelFormat.Format32bppArgb)) output.Save(destination, ImageFormat.Png);
      Console.WriteLine("Extracted " + crop.Width + "x" + crop.Height + " PNG (outside lime removed)");
    }
  }
}
'@

$destinationDir = Split-Path -Parent $Destination
New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
[SevraHeroCutout]::Save((Resolve-Path -LiteralPath $Source).Path, $Destination)


