import torch

def check_cuda():
    if torch.cuda.is_available():
        print("CUDA is available. Activating CUDA.")
        device = torch.device("cuda")
    else:
        print("CUDA is not available. Using CPU.")
        device = torch.device("cpu")
    return device

device = check_cuda()
print(f"Using device: {device}")

# Example of using the device in a tensor operation
x = torch.tensor([1.0, 2.0, 3.0], device=device)
print(x)

