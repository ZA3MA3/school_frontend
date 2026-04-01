import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { studentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, Download, CheckCircle, UserPlus, UserCheck, UserX, Bell } from 'lucide-react';
import { AxiosError } from 'axios';
import Notifications from '@/components/Notifications';

interface Class {
  id: number;
  name: string;
  description: string;
  teacher: number;
  teacher_name: string;
  students: Array<{ id: number; full_name: string }>;
  student_count: number;
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  teacher_name: string;
  class_name: string;
  due_date: string | null;
}

interface Submission {
  id: number;
  exercise: number;
  exercise_title: string;
  submitted_at: string;
  grade: number | null;
  feedback: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  teacher_name: string;
  class_name: string | null;
  created_at: string;
}

interface AttendanceRecord {
  id: number;
  student: number;
  student_name: string;
  related_class: number;
  class_name: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  marked_by: number;
  teacher_name: string;
  marked_at: string;
}

export default function StudentDashboard() {
  const { logout, user } = useAuth();
  const { unreadCount, refresh: refreshNotifications } = useNotificationWebSocket();
  const [classes, setClasses] = useState<Class[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, exercisesData, submissionsData, announcementsData, attendanceData] = await Promise.all([
        studentApi.getAllClasses(),
        studentApi.getExercises(),
        studentApi.getSubmissions(),
        studentApi.getAnnouncements(),
        studentApi.getAttendance(),
      ]);
      setClasses(classesData);
      setExercises(exercisesData);
      setSubmissions(submissionsData);
      setAnnouncements(announcementsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId: number) => {
    setEnrolling(classId);
    try {
      await studentApi.enrollInClass(classId);
      loadData();
    } catch (error) {
      console.error('Error enrolling in class:', error);
      alert('Failed to enroll in class');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDownload = (exerciseId: number) => {
    const downloadUrl = studentApi.downloadExercise(exerciseId);
    window.open(downloadUrl, '_blank');
  };

  const handleSubmitFile = async (exerciseId: number) => {
    if (!submitFile) return;
    
    setSubmitting(exerciseId);
    try {
      const formData = new FormData();
      formData.append('exercise', exerciseId.toString());
      formData.append('submission_file', submitFile);
      
      await studentApi.submitExercise(formData);
      
      setSubmitFile(null);
      setSelectedExercise(null);
      loadData();
    } catch (error) {
      console.error('Error submitting exercise:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.log('Error response data:', axiosError.response.data);
        console.log('Error response status:', axiosError.response.status);
      }
      alert('Failed to submit exercise');
    } finally {
      setSubmitting(null);
    }
  };

  const openSubmitDialog = (exerciseId: number) => {
    setSelectedExercise(exerciseId);
    setSubmitFile(null);
  };

  const isSubmitted = (exerciseId: number) => {
    return submissions.some((sub) => sub.exercise === exerciseId);
  };

  const getSubmission = (exerciseId: number) => {
    return submissions.find((sub) => sub.exercise === exerciseId);
  };

  const isEnrolled = (classId: number) => {
    const cls = classes.find((cls) => cls.id === classId);
    if (!cls) return false;
    return cls.students.some((s) => s.id === (user?.id || 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.fullName || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNotifications(true)} className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <Notifications onClose={() => {
          setShowNotifications(false);
          refreshNotifications();
        }} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classes.filter((cls) => cls.students.includes(user?.id || 0)).length}
              </div>
              <p className="text-xs text-muted-foreground">Enrolled in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Exercises</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exercises.length}</div>
              <p className="text-xs text-muted-foreground">From enrolled classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">Exercises completed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Announcements from your teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-muted-foreground">No announcements yet</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(
                  announcements.reduce((acc, ann) => {
                    const key = ann.teacher_name;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(ann);
                    return acc;
                  }, {} as { [key: string]: Announcement[] })
                ).map(([teacherName, anns]) => (
                  <div key={teacherName} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3">From: {teacherName}</h4>
                    <div className="space-y-3">
                      {anns.map((ann) => (
                        <div key={ann.id} className="p-3 bg-gray-50 rounded">
                          <h5 className="font-medium">{ann.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {ann.class_name && <span>Class: {ann.class_name}</span>}
                            <span>{new Date(ann.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Attendance</CardTitle>
            <CardDescription>Your attendance record</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-muted-foreground">No attendance records yet</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {attendance.filter(r => r.status === 'PRESENT').length}
                    </p>
                    <p className="text-sm text-green-600">Present</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-2xl font-bold text-red-600">
                      {attendance.filter(r => r.status === 'ABSENT').length}
                    </p>
                    <p className="text-sm text-red-600">Absent</p>
                  </div>
                </div>
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{record.class_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()} - Teacher: {record.teacher_name}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      record.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'PRESENT' ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{record.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Classes</CardTitle>
            <CardDescription>Browse and enroll in classes to access exercises</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-muted-foreground">No classes available yet</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {classes.map((cls) => {
                  const enrolled = isEnrolled(cls.id);
                  return (
                    <div key={cls.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {cls.description || 'No description provided'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Teacher:</strong> {cls.teacher_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cls.student_count} students enrolled
                          </p>
                          {enrolled && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-2">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enrolled
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          {enrolled ? (
                            <Button disabled size="sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Enrolled
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleEnroll(cls.id)}
                              disabled={enrolling === cls.id}
                              size="sm"
                            >
                              {enrolling === cls.id ? (
                                'Enrolling...'
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Enroll
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Exercises</CardTitle>
            <CardDescription>Download and view exercises from your enrolled classes</CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground">
                No exercises available yet. Enroll in classes to see exercises.
              </p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {exercises.map((exercise) => {
                  const submitted = isSubmitted(exercise.id);
                  const submission = getSubmission(exercise.id);
                  const isDue = exercise.due_date && new Date(exercise.due_date) < new Date();

                  return (
                    <div key={exercise.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{exercise.title}</h3>
                            {submitted && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Submitted
                              </span>
                            )}
                            {isDue && !submitted && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {exercise.description || 'No description provided'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Class: {exercise.class_name}</span>
                            <span>Teacher: {exercise.teacher_name}</span>
                            {exercise.due_date && (
                              <span>
                                Due: {new Date(exercise.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {submission && submission.grade !== null && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm">
                                <strong>Grade:</strong> {submission.grade}/20
                                {submission.feedback && (
                                  <>
                                    <br />
                                    <strong>Feedback:</strong> {submission.feedback}
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {exercise.file_url && (
                            <Button
                              onClick={() => handleDownload(exercise.id)}
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                          
                          {!submitted && !isDue && (
                            <Button
                              onClick={() => openSubmitDialog(exercise.id)}
                              size="sm"
                              variant="outline"
                            >
                              Submit Solution
                            </Button>
                          )}
                          
                          {!submitted && isDue && (
                            <Button
                              disabled
                              size="sm"
                              variant="outline"
                              title="Due date has passed"
                            >
                              Due Date Passed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Submit Your Solution</CardTitle>
                <CardDescription>
                  Upload your solution file for this exercise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSubmitFile(selectedExercise)}
                      disabled={!submitFile || submitting === selectedExercise}
                      className="flex-1"
                    >
                      {submitting === selectedExercise ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedExercise(null);
                        setSubmitFile(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
