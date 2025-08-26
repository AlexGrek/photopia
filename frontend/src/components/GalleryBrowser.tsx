import { ImageGallery } from "react-image-grid-gallery";
import type { ImageModel } from "../Models";
import { useCallback } from "react";

interface GalleryImagesProps {
  images: ImageModel[];
}

interface ConvertedImage {
  id: string;
  alt: string;
  caption: string;
  src: string;
  thumbSrc?: string;
  gridSrc?: string;
  srcSet?: string;
  mediaSizes?: string;
}

const GalleryBrowser: React.FC<GalleryImagesProps> = ({ images }) => {

  const convertGalleryImages = useCallback((images: ImageModel[]) => {
    return images.map((image: ImageModel) => {
      // You can customize the alt and caption text here.
      // This example uses the image filename for simplicity.
      const altText = image.filename.split('.').slice(0, -1).join('.');
      const captionText = `Image of ${altText}`;

      // We can assume 'src' always exists as `sizes.full`.
      const src = image.sizes.full;

      const convertedImage: ConvertedImage = {
        id: image.id,
        alt: altText,
        caption: captionText,
        src: src,
      };

      // Conditionally add other properties based on available sizes.
      if (image.sizes.thumb) {
        convertedImage.thumbSrc = image.sizes.thumb;
      }

      // `gridSrc` could map to `sizes.small`
      if (image.sizes.small) {
        convertedImage.gridSrc = image.sizes.small;
      }

      // You can also add more complex logic to generate `srcSet` and `mediaSizes`.
      // For this example, we'll create a simple one based on the available sizes.
      if (image.sizes.full && image.sizes.small && image.sizes.thumb) {
        convertedImage.srcSet = `${image.sizes.full} ${image.width ?? 2400}w, ${image.sizes.small} ${image.width ? Math.round(image.width * 0.5) : 1280}w, ${image.sizes.thumb} ${image.width ? Math.round(image.width * 0.25) : 640}w`;
        convertedImage.mediaSizes = "(max-width: 640px) 640w, (max-width: 1024px) 1280w, 2400px";
      }

      return convertedImage;
    })
  }, []);

  return <div className="m-auto fade-in-slide-up-item">
    <ImageGallery imagesInfoArray={convertGalleryImages(images)} gapSize={4} lazy/>
  </div>
}

export default GalleryBrowser;
