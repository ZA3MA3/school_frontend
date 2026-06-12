import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, studentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Moon, Sun, LogOut, Bell, BookOpen, FileText, Download } from 'lucide-react';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import Notifications from '@/components/Notifications';

interface Skill {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  class_name: string;
  due_date: string | null;
  skills: Skill[];
  level: string | null;
}

interface ClassItem {
  id: number;
  name: string;
  description: string;
  student_count: number;
}

interface ExerciseRequest {
  id: number;
  title: string;
  description: string;
  teacher_name: string;
  class_name: string;
  status: string;
  created_at: string;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'exercise-requests', label: 'Exercise Requests' },
] as const;

const LEVELS = [
  { id: 1, name: '1AP' },
  { id: 2, name: '2AP' },
  { id: 3, name: '3AP' },
  { id: 4, name: '4AP' },
  { id: 5, name: '5AP' },
  { id: 6, name: '1AM' },
  { id: 7, name: '2AM' },
  { id: 8, name: '3AM' },
  { id: 9, name: '4AM' },
  { id: 10, name: '1AS' },
  { id: 11, name: '2AS' },
  { id: 12, name: '3AS' },
];

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  // Exercise upload state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadClassId, setUploadClassId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDueDate, setUploadDueDate] = useState('');
  const [uploadLevelId, setUploadLevelId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exerciseRequests, setExerciseRequests] = useState<ExerciseRequest[]>([]);
  const [respondingExercise, setRespondingExercise] = useState<number | null>(null);

  const { unreadCount, refresh: refreshNotifications } = useNotificationWebSocket(() => {});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exercisesData, skillsData,requestsData] = await Promise.all([
        adminApi.getExercises(),
        adminApi.getSkills(),
        adminApi.getExerciseRequests(),
      ]);
      setExercises(exercisesData);
      console.log('exercises',exercisesData);
      setSkills(skillsData);
      setExerciseRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (levelId?: string) => {
    try {
      const levelNum = levelId ? parseInt(levelId) : undefined;
      const classesData = await studentApi.getAllClasses(undefined, levelNum);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchClasses(uploadLevelId || undefined);
  }, [uploadLevelId]);

  const fetchExerciseRequests = async () => {
    try {
      const data = await adminApi.getExerciseRequests();
      setExerciseRequests(data);
    } catch (error) {
      console.error('Error fetching exercise requests:', error);
    }
  };

  const handleRespondToExercise = async (exerciseId: number, action: 'approve' | 'reject') => {
    setRespondingExercise(exerciseId);
    try {
      await adminApi.respondToExerciseRequest(exerciseId, action);
      fetchExerciseRequests();
    } catch (error) {
      console.error('Error responding to exercise:', error);
      alert('Failed to respond to exercise request');
    } finally {
      setRespondingExercise(null);
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

      if (uploadDueDate) {
        formData.append('due_date', uploadDueDate);
      }

      if (uploadLevelId) {
        formData.append('level_id', uploadLevelId);
      }

      selectedSkills.forEach(skillId => {
        formData.append('skills', skillId.toString());
      });

      await adminApi.createExercise(formData);

      setUploadTitle('');
      setUploadDescription('');
      setUploadClassId('');
      setUploadFile(null);
      setUploadDueDate('');
      setUploadLevelId('');
      setSelectedSkills([]);
      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {user?.fullName || user?.email}</p>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full h-10 w-10 p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}</AvatarFallback>
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
                  Logout
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skills.length}</div>
              <p className="text-xs text-muted-foreground">Available skills</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
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
                    {tab.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Admin system overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Admin Only: You have full system access
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Exercise</CardTitle>
                <CardDescription>Upload an exercise file for students</CardDescription>
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
                    <Label htmlFor="level">Level</Label>
                    <select
                      id="level"
                      value={uploadLevelId}
                      onChange={(e) => {
                        setUploadLevelId(e.target.value);
                        setUploadClassId('');
                      }}
                      className="w-full p-2 border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700"
                    >
                      <option value="">Select a level</option>
                      {LEVELS.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="class">Select Class</Label>
                    <select
                      id="class"
                      value={uploadClassId}
                      onChange={(e) => setUploadClassId(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700"
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
                    <Label htmlFor="skills">Skills (Optional)</Label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto dark:border-zinc-700">
                      {skills.length === 0 ? (
                        <p className="text-sm text-gray-500">No skills available</p>
                      ) : (
                        <div className="space-y-1">
                          {skills.map((skill) => (
                            <label key={skill.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSkills.includes(skill.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSkills([...selectedSkills, skill.id]);
                                  } else {
                                    setSelectedSkills(selectedSkills.filter(id => id !== skill.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{skill.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Exercises</CardTitle>
                <CardDescription>Exercises you've shared with students</CardDescription>
              </CardHeader>
              <CardContent>
                {exercises.length === 0 ? (
                  <p className="text-muted-foreground">No exercises uploaded yet</p>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise) => (
                      <div key={exercise.id} className="p-4 border rounded-lg dark:border-zinc-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{exercise.title}</h3>
                              {exercise.level && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/35 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  {exercise.level}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{exercise.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Class: {exercise.class_name}
                              {exercise.due_date && ` | Due: ${new Date(exercise.due_date).toLocaleDateString()}`}
                            </p>
                            {exercise.skills && Array.isArray(exercise.skills) && exercise.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exercise.skills.map((skillItem: any) => {
                                  const skillId = typeof skillItem === 'object' ? skillItem.id : skillItem;
                                  const skillName = typeof skillItem === 'object' ? skillItem.name : (skills.find(s => s.id === skillId)?.name || `Skill ${skillId}`);
                                  return (
                                    <span key={skillId} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">
                                      {skillName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {exercise.file_url && (
                            <Button variant="outline" size="sm" onClick={async () => {
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
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'exercise-requests' && (
          <Card>
            <CardHeader>
              <CardTitle>Exercise Requests</CardTitle>
              <CardDescription>Pending exercises from teachers awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {exerciseRequests.length === 0 ? (
                <p className="text-muted-foreground">No pending exercise requests</p>
              ) : (
                <div className="space-y-4">
                  {exerciseRequests.map((req) => (
                    <div key={req.id} className="p-4 border rounded-lg dark:border-zinc-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{req.title}</h3>
                          <p className="text-sm text-muted-foreground">{req.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Teacher: {req.teacher_name} | Class: {req.class_name}
                          </p>
                          {req.created_at && (
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(req.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondToExercise(req.id, 'approve')}
                            disabled={respondingExercise === req.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRespondToExercise(req.id, 'reject')}
                            disabled={respondingExercise === req.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}