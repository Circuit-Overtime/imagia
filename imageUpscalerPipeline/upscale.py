import torch
import numpy as np
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

model_path = r"E:\Image Upscaler\RealESRGAN_x4plus.pth"
state_dict = torch.load(model_path, map_location=device)['params_ema']

model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
model.load_state_dict(state_dict, strict=False) 
model = model.to(device)


upsampler = RealESRGANer(
    scale=4,
    model_path=model_path,
    model=model,
    tile=512,  
    tile_pad=10,
    pre_pad=10,
    half=True,
    device=device
)

input_path = r"E:\Image Upscaler\testImg.jpg"
img = Image.open(input_path).convert('RGB')
img = np.array(img, dtype=np.uint8)  

output, _ = upsampler.enhance(img, outscale=4)

output_img = Image.fromarray(output)
output_img.save('output.png')

print("Upscaling complete! Output saved as output.png")
