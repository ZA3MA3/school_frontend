import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { parentApi, chatApi, teacherApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Users, TrendingUp, LogOut, Bell, BookOpen, MessageSquare, UserCheck, UserX, Baby, Download } from 'lucide-react';
import Chat from '@/components/Chat';
import Notifications from '@/components/Notifications';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  full_name: string;
  user: {
    phone_number: string;
    address: string;
    date_of_birth: string | null;
  } | null;
  date_of_birth: string | null;
  enrollment_date: string | null;
  parent_name: string | null;
  enrollment_age: number | null;
}

interface AnnouncementData {
  child_name: string;
  announcement: {
    id: number;
    title: string;
    content: string;
    teacher_name: string;
    class_name: string | null;
    created_at: string;
  };
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

interface AttendanceData {
  child_name: string;
  attendance: AttendanceRecord[];
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
  is_assigned?: boolean;
}

interface Submission {
  id: number;
  student: number;
  student_name: string;
  exercise: number;
  exercise_title: string;
  submission_file: string | null;
  submission_file_url: string | null;
  submission_text: string;
  submitted_at: string;
  grade: number | null;
  feedback: string;
  graded_at: string | null;
}

const TABS = [
  { id: 'my-children', labelKey: 'tabs.myChildren' },
  { id: 'announcements', labelKey: 'tabs.announcements' },
  { id: 'attendance-records', labelKey: 'tabs.attendanceRecords' },
  { id: 'predictions', labelKey: 'tabs.predictions' },
  { id: 'assign-exercise', labelKey: 'tabs.assignExercise' },
  { id: 'child-submissions', labelKey: 'tabs.submissions' },
] as const;

interface PredictionResult {
  student_id: number;
  student_name: string;
  prediction: string;
  confidence: number;
  features_used: {
    gender: number;
    age_at_enrollment: number;
    scholarship_holder: number;
    total_absences: number;
    absence_rate: number;
    exercises_completed: number;
    exercise_completion_rate: number;
    critical_skill_completion_rate: number;
    total_critical_skills_missed: number;
  };
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { logout, user, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('my-children');
  const [selectedChildForAnnouncements, setSelectedChildForAnnouncements] = useState<string>('');
  const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string>('');
  const [selectedChildForAssign, setSelectedChildForAssign] = useState<string>('');
  const [selectedChildForSubmissions, setSelectedChildForSubmissions] = useState<string>('');
  const [assignableExercises, setAssignableExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [children, setChildren] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [predictions, setPredictions] = useState<{ [studentId: number]: PredictionResult }>({});
  const [predicting, setPredicting] = useState<number | null>(null);
  const [assigningExerciseId, setAssigningExerciseId] = useState<number | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState<number[]>([]);
  const [skillsList, setSkillsList] = useState<{ id: number; name: string }[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

const fetchAssignableExercises = async (studentId: number) => {
    try {
      const data = await parentApi.getSearchExercises(
        studentId,
        levelFilter === 'all' ? undefined : levelFilter,
        classFilter || undefined,
        skillFilter.length > 0 ? skillFilter.join(',') : undefined
      );
      setAssignableExercises(data);
    } catch (error) {
      console.error('Error fetching assignable exercises:', error);
      alert('Failed to fetch assignable exercises');
    } finally {
      setLoadingExercises(false);
    }
  };

useEffect(() => {
    if (children.length > 0 && !selectedChildForAssign) {
      setSelectedChildForAssign(children[0].id.toString());
    }
  }, [children, selectedChildForAssign]);

  useEffect(() => {
    teacherApi.getSkills().then(setSkillsList).catch(() => {});
  }, []);

useEffect(() => {
    if (selectedChildForAssign) {
      fetchAssignableExercises(parseInt(selectedChildForAssign));
    }
  }, [selectedChildForAssign, levelFilter, classFilter, skillFilter]);



  const handleAssignExercise = async (exerciseId: number) => {
    if (!selectedChildForAssign) return;
    setAssigningExerciseId(exerciseId);
    try {
      const studentId = parseInt(selectedChildForAssign);
      await parentApi.assignExercise(studentId, exerciseId);
      
      // Update local state to mark this exercise as assigned instantly
      setAssignableExercises(prev => 
        prev.map(ex => ex.id === exerciseId ? { ...ex, is_assigned: true } : ex)
      );
    } catch (error: any) {
      console.error('Error assigning exercise:', error);
      alert('Failed to assign exercise: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAssigningExerciseId(null);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  const handlePredict = async (studentId: number) => {
    setPredicting(studentId);
    try {
      console.log('Calling prediction API for student:', studentId);
      const result = await parentApi.predictStudent(studentId);
      console.log('Prediction result:', result);
      setPredictions(prev => ({ ...prev, [studentId]: result }));
    } catch (error: any) {
      console.error('Error predicting:', error);
      if (error.response?.status === 503) {
        setModelLoading(true);
      }else{
      alert('Failed to get prediction: ' + (error.response?.data?.detail || error.message));}
    } finally {
      setPredicting(null);
    }
  };

  const childAnnouncements = announcements.filter(ann => selectedChildForAnnouncements === '' || ann.child_name === selectedChildForAnnouncements);
  const childAttendance = attendance.filter(att => selectedChildForAttendance === '' || att.child_name === selectedChildForAttendance);
  const childSubmissions = submissions.filter(sub => selectedChildForSubmissions === '' || sub.student_name === selectedChildForSubmissions);

  const handleChatUnreadUpdate = useCallback((count: number) => {
    setChatUnreadCount(count);
  }, []);

  const { unreadCount, refresh: refreshNotifications } = useNotificationWebSocket(handleChatUnreadUpdate);

  const loadChatUnreadCount = useCallback(async () => {
    try {
      const data = await chatApi.getUnreadCounts();
      setChatUnreadCount(data.total_unread || 0);
    } catch (error) {
      console.error('Error loading chat unread count:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadChatUnreadCount();
  }, [loadChatUnreadCount]);

  const loadData = async () => {
    
  
    try {
      const [childrenData, announcementsData, attendanceData, submissionsData] = await Promise.all([
        parentApi.getChildren(),
        parentApi.getAnnouncements(),
        parentApi.getAttendance(),
        parentApi.getSubmissions(),
      ]);
      setChildren(childrenData);
      console.log('Children API response:', childrenData);
      console.log('Children data type:', typeof childrenData);
      console.log('Is children data an array?', Array.isArray(childrenData));
      console.log('Number of children received:', childrenData?.length || 0);
      setAnnouncements(announcementsData);
      setAttendance(attendanceData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.parentDashboard')}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.welcome')}, {user?.fullName || user?.email}</p>
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
            <Button variant="outline" onClick={() => setShowChat(!showChat)} className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('chat.title')}
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={toggleLanguage}>
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
                
                {children.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Select Child</DropdownMenuLabel>
                    {children.map((child) => (
                      <DropdownMenuItem 
                        key={child.id}
                        onClick={async () => {
                          await switchRole('STUDENT');
                    //      window.location.href = `/student?childId=${child.id}`;
                    navigate(`/student?childId=${child.id}`);
                        }}
                        className="cursor-pointer"
                      >
                        <Baby className="mr-2 h-4 w-4" />
                        {child.full_name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('dashboard.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

{showChat && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900" style={{ height: 'calc(100vh - 73px)', top: 73 }}>
          <Chat 
            onClose={() => setShowChat(false)} 
            onUnreadCountChange={(count) => setChatUnreadCount(count)}
          />
        </div>
      )}

      {showNotifications && (
        <Notifications onClose={() => {
          setShowNotifications(false);
          refreshNotifications();
        }} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:text-white" style={showChat ? { display: 'none' } : {}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statCards.myChildrenC')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statCards.averageP')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.length > 0 ? 'Good' : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Overall status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statCards.enrolledC')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.length > 0 ? 'Active' : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Class status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statCards.notifications')}</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.length > 0 ? children.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Children linked</p>
            </CardContent>
          </Card>
        </div>

        <div className="border-b mt-8">
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

        {activeTab === 'my-children' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.myChildren')}</CardTitle>
                <CardDescription>{t('children.overviewInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <p className="text-muted-foreground">{t('children.noChildren')}</p>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <div key={child.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-lg">{child.full_name}</p>
                            {child.enrollment_date && (
                              <p className="text-sm text-muted-foreground">
                                Enrolled: {new Date(child.enrollment_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {t('children.active')}
                          </span>
                        </div>
<div className="grid grid-cols-2 gap-4 mt-3">
                          {child.user?.phone_number && (
                            <div>
                              <p className="text-xs text-muted-foreground">{t('children.phone')}</p>
                              <p className="font-medium text-sm">{child.user.phone_number}</p>
                            </div>
                          )}
                          {child.user?.address && (
                            <div>
                              <p className="text-xs text-muted-foreground">{t('children.address')}</p>
                              <p className="font-medium text-sm">{child.user.address}</p>
                            </div>
                          )}
                          {child.user?.date_of_birth && (
                            <div>
                              <p className="text-xs text-muted-foreground">{t('children.dateOfBirth')}</p>
                              <p className="font-medium text-sm">
                                {new Date(child.user.date_of_birth).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {!child.user?.date_of_birth && child.date_of_birth && (
                            <div>
                              <p className="text-xs text-muted-foreground">{t('children.dateOfBirth')}</p>
                              <p className="font-medium text-sm">
                                {new Date(child.date_of_birth).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {child.enrollment_age && (
                            <div>
                              <p className="text-xs text-muted-foreground">{t('children.enrollmentAge')}</p>
                              <p className="font-medium text-sm">{child.enrollment_age}</p>
                            </div>
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
                <CardTitle>Important Information</CardTitle>
                <CardDescription>Details about your linked children</CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <p className="text-muted-foreground">
                    Contact the school administration to link your children to your account.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <div key={child.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">{child.full_name}</h3>
                        <div className="text-sm space-y-2">
                          <div className="flex items-start">
                            <Bell className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <p className="text-muted-foreground">
                              You are linked as the parent of this student
                            </p>
                          </div>
{child.user?.phone_number && (
                            <div className="flex items-start">
                              <Bell className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                              <p className="text-muted-foreground">
                                Contact number: {child.user.phone_number}
                              </p>
                            </div>
                          )}
                          <div className="flex items-start">
                            <BookOpen className="h-4 w-4 text-purple-500 mr-2 mt-0.5" />
                            <p className="text-muted-foreground">
                              Check their exercises and assignments regularly
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

{activeTab === 'announcements' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Announcements for your children</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-muted-foreground">No announcements yet</p>
              ) : (
                <div>
                  <div className="border-b mb-4 dark:border-zinc-700">
                    <NavigationMenu>
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuLink
                            href="#"
                            active={selectedChildForAnnouncements === ''}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedChildForAnnouncements('');
                            }}
                          >
                            All
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                        {Object.keys(announcements.reduce((acc, ann) => {
                          if (!acc[ann.child_name]) acc[ann.child_name] = true;
                          return acc;
                        }, {} as Record<string, boolean>)).map((childName) => (
                          <NavigationMenuItem key={childName}>
                            <NavigationMenuLink
                              href="#"
                              active={selectedChildForAnnouncements === childName}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedChildForAnnouncements(childName);
                              }}
                            >
                              {childName}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </div>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto">
                    {childAnnouncements.length === 0 ? (
                      <p className="text-muted-foreground">No announcements for {selectedChildForAnnouncements || 'any child'}</p>
                    ) : (
                      Object.entries(
                        childAnnouncements.reduce((acc, ann) => {
                          const key = ann.child_name;
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(ann);
                          return acc;
                        }, {} as { [key: string]: AnnouncementData[] })
                      ).map(([childName, anns]) => (
<div key={childName} className="border rounded-lg p-4 dark:border-zinc-700">
                          <h4 className="font-semibold text-lg mb-3 dark:text-white">{childName}</h4>
                          <div className="space-y-3">
                            {Object.entries(
                              anns.reduce((acc, ann) => {
                                const key = ann.announcement.teacher_name;
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(ann.announcement);
                                return acc;
                              }, {} as { [key: string]: AnnouncementData['announcement'][] })
                            ).map(([teacherName, teacherAnns]) => (
                              <div key={teacherName} className="bg-gray-50 dark:bg-zinc-800 rounded p-3">
                                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">From: {teacherName}</h5>
                                {teacherAnns.map((ann) => (
                                  <div key={ann.id} className="mb-2 last:mb-0 pl-3 border-l-2 border-blue-300">
                                    <p className="font-medium">{ann.title}</p>
                                    <p className="text-sm text-muted-foreground">{ann.content}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                      {ann.class_name && <span>Class: {ann.class_name}</span>}
                                      <span>{new Date(ann.created_at).toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

{activeTab === 'attendance-records' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Attendance for your children</CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-muted-foreground">No attendance records yet</p>
              ) : (
                <div>
                  <div className="border-b mb-4 dark:border-zinc-700">
                    <NavigationMenu>
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuLink
                            href="#"
                            active={selectedChildForAttendance === ''}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedChildForAttendance('');
                            }}
                          >
                            All
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                        {attendance.map((att) => att.child_name).filter((name, i, arr) => arr.indexOf(name) === i).map((childName) => (
                          <NavigationMenuItem key={childName}>
                            <NavigationMenuLink
                              href="#"
                              active={selectedChildForAttendance === childName}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedChildForAttendance(childName);
                              }}
                            >
                              {childName}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </div>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto">
                    {childAttendance.length === 0 ? (
                      <p className="text-muted-foreground">No attendance records for {selectedChildForAttendance || 'any child'}</p>
                    ) : (
childAttendance.map((childData) => (
                        <div key={childData.child_name} className="border rounded-lg p-4 dark:border-zinc-700">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-lg dark:text-white">{childData.child_name}</h4>
                            <div className="flex gap-4">
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                <UserCheck className="inline h-4 w-4 mr-1" />
                                {childData.attendance.filter(r => r.status === 'PRESENT').length} Present
                              </span>
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm">
                                <UserX className="inline h-4 w-4 mr-1" />
                                {childData.attendance.filter(r => r.status === 'ABSENT').length} Absent
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {childData.attendance.map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded">
                                <div>
                                  <p className="font-medium dark:text-white">{record.class_name}</p>
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
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'predictions' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Predictions</CardTitle>
              <CardDescription>Predict student dropout/graduation outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {modelLoading && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                         Prediction model is still loading, please try again in a moment.
                      </p>
                    </div>
                  )}
              {children.length === 0 ? (
                <p className="text-muted-foreground">No children linked to your account yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {children.map((child) => {
                    const prediction = predictions[child.id];
                    return (
<div key={child.id} className="border rounded-lg p-4 dark:border-zinc-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium text-lg dark:text-white">{child.full_name}</p>
                          </div>
                          {!prediction && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePredict(child.id)}
                              disabled={predicting === child.id}
                            >
                              {predicting === child.id ? 'Predicting...' : 'Predict'}
                            </Button>
                          )}
                        </div>
                        
                        {prediction && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                              <div>
                                <p className="text-sm text-muted-foreground">Prediction</p>
                                <p className={`text-xl font-bold ${
                                  prediction.prediction === 'Dropout' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {prediction.prediction}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Confidence</p>
                                <p className="text-xl font-bold dark:text-white">
                                  {(prediction.confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4 dark:border-zinc-700">
                              <p className="text-sm font-medium mb-3 dark:text-white">Features Used</p>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Absences</span>
                                  <span className="font-medium dark:text-white">{prediction.features_used.total_absences}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Absence Rate</span>
                                  <span className="font-medium dark:text-white">{(prediction.features_used.absence_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Exercises Completed</span>
                                  <span className="font-medium dark:text-white">{prediction.features_used.exercises_completed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Exercise Completion</span>
                                  <span className="font-medium dark:text-white">{(prediction.features_used.exercise_completion_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Critical Skill Completion</span>
                                  <span className="font-medium dark:text-white">{(prediction.features_used.critical_skill_completion_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Critical Skills Missed</span>
                                  <span className="font-medium dark:text-white">{prediction.features_used.total_critical_skills_missed}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

{activeTab === 'assign-exercise' && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>{t('tabs.assignExercise')}</CardTitle>
      <CardDescription>Search and assign exercises for your children</CardDescription>
    </CardHeader>
    <CardContent>
      {children.length === 0 ? (
        <p className="text-muted-foreground">{t('children.noChildren')}</p>
      ) : (
        <div>
          <div className="flex gap-4 items-center mb-6">
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Select Child:</span>
            <div className="flex gap-2">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChildForAssign === child.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedChildForAssign(child.id.toString())}
                  size="sm"
                >
                  {child.full_name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 items-center mb-6">
            <div className="flex flex-col w-35">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-800">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
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

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Skills</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-between bg-white dark:bg-zinc-800">
                    {skillFilter.length > 0 ? `${skillFilter.length} skill(s) selected` : 'Filter by skills'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[180px]">
                  {skillsList.map(skill => (
                    <DropdownMenuCheckboxItem
                      key={skill.id}
                      checked={skillFilter.includes(skill.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSkillFilter([...skillFilter, skill.id]);
                        } else {
                          setSkillFilter(skillFilter.filter(id => id !== skill.id));
                        }
                      }}
                    >
                      {skill.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col w-54">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Class Name</label>
              <input
                type="text"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="Search by class name"
                className="p-2 border rounded-md text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
          </div>

          {loadingExercises ? (
            <div className="text-center py-6">{t('common.loading')}</div>
          ) : assignableExercises.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No assignable exercises available for this child.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto">
              {assignableExercises.map(exercise => (
                <div key={exercise.id} className="border rounded-lg p-4 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg dark:text-white">{exercise.title}</h3>
                      {exercise.level && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/35 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {exercise.level}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{exercise.description}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                      <p>Teacher: {exercise.teacher_name}</p>
                      {exercise.class_name && <p>Class: {exercise.class_name}</p>}
                      {exercise.due_date && <p>Due Date: {new Date(exercise.due_date).toLocaleDateString()}</p>}
                    </div>
                    {exercise.skills && Array.isArray(exercise.skills) && exercise.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {exercise.skills.map((skillItem: any) => {
                          const skillId = typeof skillItem === 'object' ? skillItem.id : skillItem;
                          const skillName = typeof skillItem === 'object' ? skillItem.name : `Skill ${skillId}`;
                          return (
                            <span key={skillId} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/35 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                              {skillName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end items-center">
                    <Button
                      size="sm"
                      variant={exercise.is_assigned ? "secondary" : "default"}
                      className={`w-full sm:w-auto ${exercise.is_assigned ? "opacity-60 cursor-not-allowed bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" : ""}`}
                      disabled={exercise.is_assigned || assigningExerciseId === exercise.id}
                      onClick={() => handleAssignExercise(exercise.id)}
                    >
                      {assigningExerciseId === exercise.id ? (
                        'Assigning...'
                      ) : exercise.is_assigned ? (
                        'Assigned'
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CardContent>
  </Card>
)}
        {activeTab === 'child-submissions' && (
          <Card className="mt-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-lg">
            <CardHeader className="border-b dark:border-zinc-800 pb-4">
              <CardTitle className="text-xl font-bold dark:text-white">Child Submissions</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">Review submissions your children made on exercises you assigned</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {submissions.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">No submissions yet</p>
              ) : (
                <div>
                  <div className="border-b mb-6 dark:border-zinc-700 pb-2">
                    <NavigationMenu>
                      <NavigationMenuList className="flex flex-wrap gap-2">
                        <NavigationMenuItem>
                          <NavigationMenuLink
                            href="#"
                            active={selectedChildForSubmissions === ''}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedChildForSubmissions('');
                            }}
                            className="px-3 py-1.5 rounded-md transition-colors"
                          >
                            All
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                        {Object.keys(submissions.reduce((acc, sub) => {
                          if (!acc[sub.student_name]) acc[sub.student_name] = true;
                          return acc;
                        }, {} as Record<string, boolean>)).map((childName) => (
                          <NavigationMenuItem key={childName}>
                            <NavigationMenuLink
                              href="#"
                              active={selectedChildForSubmissions === childName}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedChildForSubmissions(childName);
                              }}
                              className="px-3 py-1.5 rounded-md transition-colors"
                            >
                              {childName}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {childSubmissions.length === 0 ? (
                      <p className="text-muted-foreground py-4 text-center">No submissions for {selectedChildForSubmissions || 'any child'}</p>
                    ) : (
                      childSubmissions.map((submission) => (
                        <div key={submission.id} className="p-5 border rounded-xl flex justify-between items-center dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-all duration-250 shadow-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base text-gray-900 dark:text-zinc-100">{submission.student_name}</h3>
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                Assigned Exercise
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Exercise:</span> {submission.exercise_title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-4 items-center">
                              {submission.grade !== null ? (
                                <span className="inline-flex items-center text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-lg">
                                  Grade: {submission.grade}/20
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
                                  Not graded yet
                                </span>
                              )}
                              {submission.feedback && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-zinc-300 dark:border-zinc-700 pl-3">
                                  "{submission.feedback}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
{submission.submission_file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const { blob, filename } = await teacherApi.downloadSubmissionBlob(submission.id);
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
                                className="bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:text-white text-gray-700 border dark:border-zinc-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
