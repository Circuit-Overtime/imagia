import io
import torch
import numpy as np
from PIL import Image
from flask import Flask, request, send_file
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = "E:\\Image Upscaler\\RealESRGAN_x4plus.pth"
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

@app.route('/upscale', methods=['POST'])
def upscale():
    try:
        file = request.files['image']
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        img_np = np.array(image, dtype=np.uint8)
        
        output, _ = upsampler.enhance(img_np, outscale=4)
        output_img = Image.fromarray(output)
        
        img_io = io.BytesIO()
        output_img.save(img_io, format='PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
