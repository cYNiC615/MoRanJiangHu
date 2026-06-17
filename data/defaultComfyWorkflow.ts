const 默认ZImageTurboComfyUI工作流 = {
  "3": {
    "inputs": {
      "seed": "__SEED__",
      "steps": "__STEPS__",
      "cfg": "__CFG__",
      "sampler_name": "__SAMPLER__",
      "scheduler": "__SCHEDULER__",
      "denoise": 1,
      "model": [
        "57",
        0
      ],
      "positive": [
        "16",
        0
      ],
      "negative": [
        "40",
        0
      ],
      "latent_image": [
        "53",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器"
    }
  },
  "4": {
    "inputs": {
      "ckpt_name": "zImageTurboBaseAIO_zImageTurboFP8AIO.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Checkpoint加载器（简易）"
    }
  },
  "8": {
    "inputs": {
      "samples": [
        "3",
        0
      ],
      "vae": [
        "4",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE解码"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": [
        "8",
        0
      ]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "保存图像"
    }
  },
  "16": {
    "inputs": {
      "text": "__PROMPT__",
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "Positive Prompt"
    }
  },
  "40": {
    "inputs": {
      "text": "__NEGATIVE_PROMPT__",
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "Negative Prompt"
    }
  },
  "53": {
    "inputs": {
      "width": "__WIDTH__",
      "height": "__HEIGHT__",
      "batch_size": 1
    },
    "class_type": "EmptySD3LatentImage",
    "_meta": {
      "title": "空Latent图像（SD3）"
    }
  },
  "56": {
    "inputs": {
      "lora_name": "Mystic-XXX-ZIT-v3.safetensors",
      "strength_model": 0.5,
      "model": [
        "4",
        0
      ]
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": {
      "title": "LoRA加载器（仅模型）"
    }
  },
  "57": {
    "inputs": {
      "shift": 3,
      "model": [
        "56",
        0
      ]
    },
    "class_type": "ModelSamplingAuraFlow",
    "_meta": {
      "title": "采样算法（AuraFlow）"
    }
  }
};

const 默认ZImageTurboNSFWComfyUI工作流 = {
  "9": {
    "inputs": {
      "filename_prefix": "z-image/nsfw",
      "images": [
        "43",
        0
      ]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "保存图像"
    }
  },
  "39": {
    "inputs": {
      "clip_name": "qwen_3_4b.safetensors",
      "type": "lumina2",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": {
      "title": "加载CLIP"
    }
  },
  "40": {
    "inputs": {
      "vae_name": "ae.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "加载VAE"
    }
  },
  "41": {
    "inputs": {
      "width": "__WIDTH__",
      "height": "__HEIGHT__",
      "batch_size": 1
    },
    "class_type": "EmptySD3LatentImage",
    "_meta": {
      "title": "空Latent图像（SD3）"
    }
  },
  "43": {
    "inputs": {
      "samples": [
        "44",
        0
      ],
      "vae": [
        "40",
        0
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE解码"
    }
  },
  "44": {
    "inputs": {
      "seed": "__SEED__",
      "steps": "__STEPS__",
      "cfg": "__CFG__",
      "sampler_name": "__SAMPLER__",
      "scheduler": "__SCHEDULER__",
      "denoise": 1,
      "model": [
        "47",
        0
      ],
      "positive": [
        "45",
        0
      ],
      "negative": [
        "54",
        0
      ],
      "latent_image": [
        "41",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器"
    }
  },
  "45": {
    "inputs": {
      "text": "__PROMPT__",
      "clip": [
        "39",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "正面提示词编码"
    }
  },
  "46": {
    "inputs": {
      "unet_name": "mPMix_NSFW_V9_fp8.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "NSFW主模型加载 - mPMix"
    }
  },
  "47": {
    "inputs": {
      "shift": 3,
      "model": [
        "53",
        0
      ]
    },
    "class_type": "ModelSamplingAuraFlow",
    "_meta": {
      "title": "采样算法（AuraFlow）"
    }
  },
  "53": {
    "inputs": {
      "model": [
        "46",
        0
      ],
      "lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors",
      "strength_model": 1
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": {
      "title": "Qwen Lightning 4steps LoRA"
    }
  },
  "54": {
    "inputs": {
      "text": "__NEGATIVE_PROMPT__",
      "clip": [
        "39",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "负面提示词编码"
    }
  }
};

const 默认稳定普通ComfyUI工作流 = 默认ZImageTurboComfyUI工作流;

export const 默认ComfyUI工作流JSON = JSON.stringify(默认稳定普通ComfyUI工作流, null, 2);
export const 默认NSFWComfyUI工作流JSON = JSON.stringify(默认ZImageTurboNSFWComfyUI工作流, null, 2);
