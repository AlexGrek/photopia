import ImageUploader from "../components/ImageUploader";
import Logo from "../components/Logo";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const ImageUploaderPage: React.FC = () => {
    useDocumentTitle('Upload images');

    return <div className="fadeIn">
        <div className='absolute' style={{ transform: "translate(1.5em, 1.5em)" }}><Logo /></div>
        <ImageUploader />
    </div>
}

export default ImageUploaderPage;