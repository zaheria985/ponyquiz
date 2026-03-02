import { notFound } from "next/navigation";
import { getStudentDetail } from "@/lib/queries/admin";
import PageHeader from "@/components/ui/PageHeader";
import StudentDetail from "@/components/admin/StudentDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = params;
  const student = await getStudentDetail(id);

  if (!student) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={student.name} />
      <StudentDetail student={student} />
    </div>
  );
}
