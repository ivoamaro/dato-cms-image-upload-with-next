import FileUpload from '@/components/FileUpload';
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <div className="m-5 w-[500px]">
        <FileUpload locationId="" />
      </div>
    </main>
  );
}
