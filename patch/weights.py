import math
import numpy as np


# https://github.com/Experience-Monks/glsl-fast-gaussian-blur
# https://www.rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/


def kernel(sigma, size, start=0):
    """
    Create a 1D Gaussian kernel.
    """
    if sigma == start:
        return None, None

    sigma = np.sqrt(sigma ** 2 - start ** 2)
    print(sigma)
    half_size = size // 2
    pixels = np.arange(size).astype(np.float32) - half_size
    kernel = np.exp(-pixels**2 / (2.0 * sigma**2))
    kernel /= kernel.sum()
    kernel = kernel[half_size:]
    pixels = pixels[half_size:]

    print(kernel)
    weights = [kernel[0].item()]
    offsets = [0]
    for i in range(1, len(pixels), 2):
        j = i + 1
        if j == len(pixels):
            weights.append(kernel[i].item())
            offsets.append(pixels[i].item())
            break

        weight = kernel[i] + kernel[j]
        offset = (pixels[i] * kernel[i] + pixels[j] * kernel[j]) / weight
        weights.append(weight.item())
        offsets.append(offset.item())

    return offsets, weights


def adjust_sigma(sigma):
    while (sigma - 5) % 4 != 0:
        sigma -= 1

    return sigma


def generate_weights(path: str, size: int):
    with open(path, "w") as f:
        sigma = math.floor(size / 6)
        size = adjust_sigma(int(2 * np.ceil(3 * sigma) + 1))
        offsets, weights = kernel(sigma, size)
        f.write(f'{len(offsets)}\n')
        f.write(' '.join(map(str, offsets)) + '\n')
        f.write(' '.join(map(str, weights)) + '\n')
        f.write('\n')


if __name__ == "__main__":
    generate_weights("weights.txt", 13)
