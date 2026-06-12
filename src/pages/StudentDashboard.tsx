import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { useSearchParams } from 'react-router-dom';
import { studentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, LogOut, FileText, Download, CheckCircle, UserPlus, UserCheck, UserX, Bell, Search, Clock } from 'lucide-react';
import { AxiosError } from 'axios';
import Notifications from '@/components/Notifications';
import { RoleSwitcher } from '@/components/RoleSwitcher';

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Array<{ id: number; name: string; class_teacher_id: number; level: string | null }>;
  student_count: number;
  enrollment_status: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    class_teacher_id:number;
    requested_at: string | null;
    responded_at: string | null;
  } | null;
}

interface ClassCard {
  classId: number;
  classTeacherId: number;
  name: string;
  description: string;
  teacherName: string;
  teacherId: number;
  level: string | null;
  studentCount: number;
  enrollmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface Skill {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  teacher_name: string;
  class_name: string;
  due_date: string | null;
  skills: Skill[];
  level?: string | null;
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

const TABS = [
  { id: 'class-enrollment', labelKey: 'student.tabs.classes' },
  { id: 'announcements', labelKey: 'student.tabs.announcements' },
  { id: 'available-exercises', labelKey: 'student.tabs.exercises' },
  { id: 'my-attendance', labelKey: 'student.tabs.attendance' },
] as const;

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { unreadCount, refresh: refreshNotifications } = useNotificationWebSocket();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('class-enrollment');
  const [classes, setClasses] = useState<Class[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const parentChildId = childId ? parseInt(childId) : null;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuggestions]);

const loadData = async () => {
    try {
      const [classesData, exercisesData, submissionsData, announcementsData, attendanceData, skillsData] = await Promise.all([
        studentApi.getAllClasses(parentChildId || undefined),
        studentApi.getExercises(parentChildId || undefined),
        studentApi.getSubmissions(parentChildId || undefined),
        studentApi.getAnnouncements(parentChildId || undefined),
        studentApi.getAttendance(parentChildId || undefined),
        studentApi.getSkills(),
      ]);
      console.log(`[DEBUG] Fetched classesData length:`, classesData.length, `Data:`, classesData);
      setClasses(classesData);
      setExercises(exercisesData);
      setSubmissions(submissionsData);
      setAnnouncements(announcementsData);
      setAttendance(attendanceData);
      setSkills(skillsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

const handleEnroll = async (classTeacherId: number) => {
    console.log(`[DEBUG] handleEnroll started for classTeacherId: ${classTeacherId}`);
    setEnrolling(classTeacherId);
    try {
      console.log(`[DEBUG] Calling studentApi.enrollInClass(${classTeacherId}, ${parentChildId})...`);
      const response = await studentApi.enrollInClass(classTeacherId, parentChildId || undefined);
      console.log(`[DEBUG] studentApi.enrollInClass completed. Response:`, response);
       
      console.log(`[DEBUG] Calling loadData() to refresh classes...`);
      await loadData();
      console.log(`[DEBUG] loadData() completed.`);
    } catch (error) {
      console.error('[DEBUG] Error enrolling in class:', error);
      alert('Failed to enroll in class');
    } finally {
      console.log(`[DEBUG] Clearing enrolling state for classTeacherId: ${classTeacherId}`);
      setEnrolling(null);
    }
};

  const handleSubmitFile = async (exerciseId: number) => {
    if (!submitFile) return;
    
    setSubmitting(exerciseId);
    try {
      const formData = new FormData();
      formData.append('exercise', exerciseId.toString());
      formData.append('submission_file', submitFile);
      
      await studentApi.submitExercise(formData, parentChildId || undefined);
      
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
  
  const handleMarkAsDone = async (exerciseId: number) => {
    setSubmitting(exerciseId);
    try {
      const formData = new FormData();
      formData.append('exercise', exerciseId.toString());
      
      await studentApi.submitExercise(formData, parentChildId || undefined);
      
      setSelectedExercise(null);
      loadData();
    } catch (error) {
      console.error('Error marking as done:', error);
      alert('Failed to mark as done');
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

  const flattenToClassCards = (): ClassCard[] => {
    const cards: ClassCard[] = [];
    for (const cls of classes) {
      if (cls.teachers.length === 0) {
        cards.push({
          classId: cls.id,
          classTeacherId: 0,
          name: cls.name,
          description: cls.description,
          teacherName: 'No teacher assigned',
          teacherId: 0,
          level: null,
          studentCount: cls.student_count,
          enrollmentStatus: null,  // No teacher = no enrollment possible
        });
      } else {
        for (const teacher of cls.teachers) {
          // ✅ Match enrollment status by class_teacher_id
          let enrollmentStatus = null;
          if (cls.enrollment_status && cls.enrollment_status.class_teacher_id === teacher.class_teacher_id) {
            enrollmentStatus = cls.enrollment_status.status;
          }
          
          cards.push({
            classId: cls.id,
            classTeacherId: teacher.class_teacher_id,
            name: cls.name,
            description: cls.description,
            teacherName: teacher.name,
            teacherId: teacher.id,
            level: teacher.level,
            studentCount: cls.student_count,
            enrollmentStatus: enrollmentStatus,  // ✅ Now per teacher!
          });
        }
      }
    }
    return cards;
  };

  const classCards = flattenToClassCards();

  const filteredClassCards = classCards.filter((card) => {
    const query = searchQuery.toLowerCase();
    if (query && !card.name.toLowerCase().includes(query) && !card.teacherName.toLowerCase().includes(query)) {
      return false;
    }
    if (levelFilter !== 'all' && card.level !== levelFilter) return false;
    const enrolled = card.enrollmentStatus === 'APPROVED';
    if (enrollmentFilter === 'enrolled' && !enrolled) return false;
    if (enrollmentFilter === 'not_enrolled' && (enrolled || card.enrollmentStatus === 'PENDING')) return false;
    return true;
  });

  const suggestions = searchQuery.length >= 1 
    ? classCards
        .filter((card) => 
          card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          card.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const handleSelectSuggestion = (card: ClassCard) => {
    setSearchQuery(card.name);
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">{t('student.common.loading')}</div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('student.dashboard.studentDashboard')}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('student.dashboard.welcome')}, {user?.fullName || user?.email}</p>
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
            <Button variant="outline" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
              {i18n.language === 'en' ? 'ع' : 'EN'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full h-10 w-10 p-0 -translate-y-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                
<RoleSwitcher />
                
              
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('student.dashboard.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {showNotifications && (
        <Notifications onClose={() => {
          setShowNotifications(false);
          refreshNotifications();
        }} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('student.statCards.enrolledC')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classCards.filter((card) => card.enrollmentStatus === 'APPROVED').length}
              </div>
              <p className="text-xs text-muted-foreground"> Enrolled in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('student.statCards.availableExercises')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exercises.length}</div>
              <p className="text-xs text-muted-foreground">From enrolled classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('student.statCards.submissions')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">Exercises completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="border-b mb-6">
          <NavigationMenu>
            <NavigationMenuList>
              {TABS.map((tab) => (
                <NavigationMenuItem key={tab.id}>
                  <NavigationMenuLink
                    href="#"
                    active={activeTab === tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab.id);
                    }}
                  >
                    {t(tab.labelKey)}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {activeTab === 'class-enrollment' && (
          <Card>
            <CardHeader>
              <CardTitle>Available Classes</CardTitle>
              <CardDescription>Browse and enroll in classes to access exercises</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-muted-foreground">No classes available yet</p>
              ) : (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by class name or teacher..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="pl-10 bg-white dark:bg-zinc-800"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map((card) => (
                          <div
                            key={`${card.classId}-${card.classTeacherId}`}
                            onClick={() => handleSelectSuggestion(card)}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer border-b last:border-b-0 dark:border-zinc-700"
                          >
                            <p className="font-medium">{card.name}</p>
                            <p className="text-sm text-muted-foreground">Teacher: {card.teacherName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={enrollmentFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEnrollmentFilter('all')}
                        className={enrollmentFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        All Classes
                      </Button>
                      <Button
                        variant={enrollmentFilter === 'enrolled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEnrollmentFilter('enrolled')}
                        className={enrollmentFilter === 'enrolled' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Enrolled
                      </Button>
                      <Button
                        variant={enrollmentFilter === 'not_enrolled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEnrollmentFilter('not_enrolled')}
                        className={enrollmentFilter === 'not_enrolled' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        Not Enrolled
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {t('classes.level')}:
                      </span>
                      <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-800">
                          <SelectValue placeholder={t('classes.level')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('student.classes.allLevels')}</SelectItem>
                          <SelectItem value="1AP">1AP</SelectItem>
                          <SelectItem value="2AP">2AP</SelectItem>
                          <SelectItem value="3AP">3AP</SelectItem>
                          <SelectItem value="4AP">4AP</SelectItem>
                          <SelectItem value="5AP">5AP</SelectItem>
                          <SelectItem value="1AM">1AM</SelectItem>
                          <SelectItem value="2AM">2AM</SelectItem>
                          <SelectItem value="3AM">3AM</SelectItem>
                          <SelectItem value="4AM">4AM</SelectItem>
                          <SelectItem value="1AS">1AS</SelectItem>
                          <SelectItem value="2AS">2AS</SelectItem>
                          <SelectItem value="3AS">3AS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {filteredClassCards.length === 0 ? (
                    <p className="text-muted-foreground">No classes match your filters</p>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {filteredClassCards.map((card) => {
                        const enrolled = card.enrollmentStatus === 'APPROVED';
                        const enrollmentStatus = card.enrollmentStatus;
                        return (
                          <div key={`${card.classId}-${card.classTeacherId}`} className="p-4 border rounded-lg dark:border-zinc-700">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{card.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {card.description || 'No description provided'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  <strong>Teacher:</strong> {card.teacherName}
                                </p>
                                {card.level && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Level:</strong> {card.level}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {card.studentCount} students enrolled
                                </p>
                                {enrolled && (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-2">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Enrolled
                                  </span>
                                )}
                                {enrollmentStatus === 'PENDING' && (
                                  <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full mt-2">
                                    Pending
                                  </span>
                                )}
                                {enrollmentStatus === 'REJECTED' && (
                                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full mt-2">
                                    Rejected - Can Resubmit
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                {enrolled ? (
                                  <Button disabled size="sm">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Enrolled
                                  </Button>
                                ) : enrollmentStatus === 'PENDING' ? (
                                  <Button disabled size="sm" variant="outline" className="opacity-50 cursor-not-allowed">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Pending...
                                  </Button>
                                ) : enrollmentStatus === 'REJECTED' ? (
                                  <Button
                                    onClick={() => handleEnroll(card.classTeacherId)}
                                    disabled={enrolling === card.classTeacherId}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    {enrolling === card.classTeacherId ? 'Resending...' : 'Resend Request'}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleEnroll(card.classTeacherId)}
                                    disabled={enrolling === card.classTeacherId}
                                    size="sm"
                                  >
                                    {enrolling === card.classTeacherId ? (
                                      'Requesting...'
                                    ) : (
                                      <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Request Enrollment
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
                </>
              )}
            </CardContent>
          </Card>
        )}

{activeTab === 'announcements' && (
          <Card>
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
                    <div key={teacherName} className="border rounded-lg p-4 dark:border-zinc-700">
                      <h4 className="font-semibold text-lg mb-3 dark:text-white">From: {teacherName}</h4>
                      <div className="space-y-3">
                        {anns.map((ann) => (
                          <div key={ann.id} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded">
                            <h5 className="font-medium dark:text-white">{ann.title}</h5>
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
        )}

        {activeTab === 'available-exercises' && (
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
                              {exercise.level && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/35 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  {exercise.level}
                                </span>
                              )}
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
                            {exercise.skills && Array.isArray(exercise.skills) && exercise.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exercise.skills.map((skillItem: any) => {
                                  const skillId = typeof skillItem === 'object' ? skillItem.id : skillItem;
                                  const skillName = typeof skillItem === 'object' ? skillItem.name : (skills.find(s => s.id === skillId)?.name || `Skill ${skillId}`);
                                  return (
                                    <span key={skillId} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                                      {skillName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
{submission && submission.grade !== null && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                <p className="text-sm dark:text-white">
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
                                onClick={async () => {
                                  try {
                                    const { blob, filename } = await studentApi.downloadExerciseBlob(exercise.id);
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Download failed', err);
                                  }
                                }}
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
                            
                            {!submitted && !isDue && (
                              <Button
                                onClick={() => handleMarkAsDone(exercise.id)}
                                size="sm"
                                disabled={submitting === exercise.id}
                              >
                                {submitting === exercise.id ? '...' : 'Mark as Done'}
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
        )}

{activeTab === 'my-attendance' && (
          <Card>
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
                    <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {attendance.filter(r => r.status === 'PRESENT').length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">Present</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900 rounded">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {attendance.filter(r => r.status === 'ABSENT').length}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">Absent</p>
                    </div>
                  </div>
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded dark:border-zinc-700">
                      <div>
                        <p className="font-medium dark:text-white">{record.class_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()} - Teacher: {record.teacher_name}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        record.status === 'PRESENT' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
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
        )}

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
