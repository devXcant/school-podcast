import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ICourse } from "../../types";
// import { ICourse } from "@/types";

interface CourseListProps {
  courses: ICourse[];
  emptyMessage?: string;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  emptyMessage = "No courses found.",
}) => {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Link
          href={`/courses/${course.id || course._id}`}
          key={course.id || course._id}
        >
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.code}</p>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {Array.isArray(course.students)
                        ? course.students.length
                        : 0}{" "}
                      students
                    </Badge>
                    <Badge variant="outline">
                      {Array.isArray(course.podcasts)
                        ? course.podcasts.length
                        : 0}{" "}
                      podcasts
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CourseList;
