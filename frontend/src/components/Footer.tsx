export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="py-6 text-center mt-10">
            <p className="text-xs font-light tracking-wide text-gray-600">
                by Unknown Desires · {year}
            </p>
        </footer>
    );
}
