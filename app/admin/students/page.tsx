import { getStudents } from "@/lib/queries/admin";
import PageHeader from "@/components/ui/PageHeader";
import StudentList from "@/components/admin/StudentList";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div>
      <PageHeader title="Students" />
      <StudentList initialStudents={students} />
    </div>
  );
}
