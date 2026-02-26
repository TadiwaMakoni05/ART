from PIL import Image, ImageDraw

def create_icon(size, filename):
    # Create an image with black background
    img = Image.new('RGB', (size, size), color = (0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Just draw a simple white circle to act as a placeholder logo
    margin = int(size * 0.1)
    d.ellipse([margin, margin, size-margin, size-margin], fill=(255, 255, 255))
    
    img.save(filename)
    print(f"Generated {filename}")

if __name__ == "__main__":
    create_icon(192, r"C:\Users\user\Desktop\ART\frontend\public\icon-192.png")
    create_icon(512, r"C:\Users\user\Desktop\ART\frontend\public\icon-512.png")
