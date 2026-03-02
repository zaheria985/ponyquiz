import { getImages } from "@/lib/queries/images";
import PageHeader from "@/components/ui/PageHeader";
import ImageList from "@/components/admin/ImageList";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const images = await getImages();

  return (
    <div>
      <PageHeader title="Images" />
      <ImageList initialImages={images} />
    </div>
  );
}
