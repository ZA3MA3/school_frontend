import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { teacherApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut, Upload, FileText, Clock, Download, CheckCircle, Star, MessageSquare, Megaphone } from 'lucide-react';
import Chat from '@/components/Chat';

interface Class {
  id: number;
  name: string;
  description: string;
  teacher_name: string;
  student_count: number;
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  class_name: string;
  due_date: string | null;
}

interface Submission {
  id: number;
  student: number;
  student_name: string;
  exercise: number;
  exercise_title: string;
  submission_file_url: string | null;
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

export default function TeacherDashboard() {
  const { logout, user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadClassId, setUploadClassId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDueDate, setUploadDueDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementClassId, setAnnouncementClassId] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, exercisesData, submissionsData, announcementsData] = await Promise.all([
        teacherApi.getClasses(),
        teacherApi.getExercises(),
        teacherApi.getSubmissions(),
        teacherApi.getAnnouncements(),
      ]);
      setClasses(classesData);
      setExercises(exercisesData);
      setSubmissions(submissionsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadClassId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('related_class', uploadClassId);
      formData.append('file_path', uploadFile);
      
      // Only append due_date if it's provided
      if (uploadDueDate) {
        formData.append('due_date', uploadDueDate);
      }

      await teacherApi.createExercise(formData);
      
      // Reset form and reload exercises
      setUploadTitle('');
      setUploadDescription('');
      setUploadClassId('');
      setUploadFile(null);
      setUploadDueDate('');
      setShowUploadForm(false);
      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const openGradingDialog = (submission: Submission) => {
    setGradingSubmission(submission.id);
    setGradeValue(submission.grade !== null ? submission.grade.toString() : '');
    setFeedbackText(submission.feedback || '');
  };

  const handleGrade = async () => {
    if (!gradingSubmission || !gradeValue) return;
    
    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20) {
      alert('Grade must be between 0 and 20');
      return;
    }
    
    setIsGrading(true);
    try {
      await teacherApi.gradeSubmission(gradingSubmission, gradeNum, feedbackText);
      setGradingSubmission(null);
      setGradeValue('');
      setFeedbackText('');
      loadData();
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Failed to grade submission');
    } finally {
      setIsGrading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    
    setIsPosting(true);
    try {
      const classId = announcementClassId ? parseInt(announcementClassId) : undefined;
      await teacherApi.createAnnouncement(announcementTitle, announcementContent, classId);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementClassId('');
      setShowAnnouncementForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setIsPosting(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.fullName || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowChat(!showChat)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {showChat && (
        <div className="fixed inset-0 z-50 bg-white" style={{ height: 'calc(100vh - 73px)', top: 73 }}>
          <Chat onClose={() => setShowChat(false)} />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={showChat ? { display: 'none' } : {}}>
        <div className="mb-6">
          <Button onClick={() => setShowUploadForm(!showUploadForm)}>
            <Upload className="h-4 w-4 mr-2" />
            {showUploadForm ? 'Cancel Upload' : 'Upload New Exercise'}
          </Button>
        </div>

        {showUploadForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload New Exercise</CardTitle>
              <CardDescription>Upload an exercise file for your students</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="title">Exercise Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., Math Homework Chapter 5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Exercise description"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={uploadDueDate}
                    onChange={(e) => setUploadDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="class">Select Class</Label>
                  <select
                    id="class"
                    value={uploadClassId}
                    onChange={(e) => setUploadClassId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.student_count} students)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="file">Upload File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Exercise'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
              <p className="text-xs text-muted-foreground">Posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classes.reduce((sum, cls) => sum + cls.student_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exercises</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exercises.length}</div>
              <p className="text-xs text-muted-foreground">Total uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s) => s.grade === null).length}
              </div>
              <p className="text-xs text-muted-foreground">Need grading</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}>
            <Megaphone className="h-4 w-4 mr-2" />
            {showAnnouncementForm ? 'Cancel' : 'Create Announcement'}
          </Button>
        </div>

        {showAnnouncementForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
              <CardDescription>Post an announcement for your students and their parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="announcementTitle">Title</Label>
                  <Input
                    id="announcementTitle"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label htmlFor="announcementContent">Content</Label>
                  <textarea
                    id="announcementContent"
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Write your announcement here..."
                    className="w-full p-2 border rounded-md min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="announcementClass">Class (Optional)</Label>
                  <select
                    id="announcementClass"
                    value={announcementClassId}
                    onChange={(e) => setAnnouncementClassId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All my classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleCreateAnnouncement} disabled={isPosting}>
                  {isPosting ? 'Posting...' : 'Post Announcement'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Announcements</CardTitle>
            <CardDescription>Announcements you've posted</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-muted-foreground">No announcements yet</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{ann.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {ann.class_name && <span>Class: {ann.class_name}</span>}
                      <span>{new Date(ann.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes you teach</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-muted-foreground">No classes assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {cls.student_count} students enrolled
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Exercises</CardTitle>
              <CardDescription>Files you've shared with students</CardDescription>
            </CardHeader>
            <CardContent>
              {exercises.length === 0 ? (
                <p className="text-muted-foreground">No exercises uploaded yet</p>
              ) : (
                <div className="space-y-4">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{exercise.title}</h3>
                          <p className="text-sm text-muted-foreground">{exercise.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Class: {exercise.class_name}
                            {exercise.due_date && ` | Due: ${new Date(exercise.due_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        {exercise.file_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(exercise.file_url!, '_blank')}>
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
              <CardDescription>Download and review student submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-muted-foreground">No submissions yet</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{submission.exercise_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Student: {submission.student_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          {submission.grade !== null && (
                            <p className="text-sm mt-1">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Grade: {submission.grade}/20
                              </span>
                            </p>
                          )}
                        </div>
                        {submission.submission_file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(teacherApi.downloadSubmission(submission.id), '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openGradingDialog(submission)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Grade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grading Dialog */}
        {gradingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Grade Submission</CardTitle>
                <CardDescription>
                  Enter grade (out of 20) and feedback for the student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grade">Grade (out of 20)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <textarea
                      id="feedback"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Enter feedback for the student..."
                      className="w-full p-2 border rounded-md min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGrade}
                      disabled={!gradeValue || isGrading}
                      className="flex-1"
                    >
                      {isGrading ? 'Saving...' : 'Save Grade'}
                    </Button>
                    <Button
                      onClick={() => {
                        setGradingSubmission(null);
                        setGradeValue('');
                        setFeedbackText('');
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
