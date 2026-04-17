import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { parentApi, chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, LogOut, Bell, BookOpen, MessageSquare, UserCheck, UserX } from 'lucide-react';
import Chat from '@/components/Chat';
import Notifications from '@/components/Notifications';

interface Student {
  id: number;
  full_name: string;
  phone_number: string;
  address: string;
  parent_occupation: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  parent_name: string | null;
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

const TABS = [
  { id: 'my-children', label: 'My Children' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'attendance-records', label: 'Attendance Records' },
  { id: 'predictions', label: 'Predictions' },
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
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('my-children');
  const [selectedChildForAnnouncements, setSelectedChildForAnnouncements] = useState<string>('');
  const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string>('');
  const [children, setChildren] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [predictions, setPredictions] = useState<{ [studentId: number]: PredictionResult }>({});
  const [predicting, setPredicting] = useState<number | null>(null);

  const handlePredict = async (studentId: number) => {
    setPredicting(studentId);
    try {
      console.log('Calling prediction API for student:', studentId);
      const result = await parentApi.predictStudent(studentId);
      console.log('Prediction result:', result);
      setPredictions(prev => ({ ...prev, [studentId]: result }));
    } catch (error: any) {
      console.error('Error predicting:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      if (error.response?.data) {
        console.error('Server error data:', error.response.data);
      }
      alert('Failed to get prediction: ' + (error.response?.data?.detail || error.message));
    } finally {
      setPredicting(null);
    }
  };

  const childAnnouncements = announcements.filter(ann => selectedChildForAnnouncements === '' || ann.child_name === selectedChildForAnnouncements);
  const childAttendance = attendance.filter(att => selectedChildForAttendance === '' || att.child_name === selectedChildForAttendance);

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
      const [childrenData, announcementsData, attendanceData] = await Promise.all([
        parentApi.getChildren(),
        parentApi.getAnnouncements(),
        parentApi.getAttendance(),
      ]);
      setChildren(childrenData);
      setAnnouncements(announcementsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
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
            <Button variant="outline" onClick={() => setShowChat(!showChat)} className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
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

      {showChat && (
        <div className="fixed inset-0 z-50 bg-white" style={{ height: 'calc(100vh - 73px)', top: 73 }}>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={showChat ? { display: 'none' } : {}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
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
              <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
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
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
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
          <nav className="-mb-px flex space-x-4" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'my-children' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Children</CardTitle>
                <CardDescription>Overview of your children's information</CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <p className="text-muted-foreground">No children linked to your account yet</p>
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
                            Active
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          {child.phone_number && (
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="font-medium text-sm">{child.phone_number}</p>
                            </div>
                          )}
                          {child.address && (
                            <div>
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p className="font-medium text-sm">{child.address}</p>
                            </div>
                          )}
                          {child.parent_occupation && (
                            <div>
                              <p className="text-xs text-muted-foreground">Parent Occupation</p>
                              <p className="font-medium text-sm">{child.parent_occupation}</p>
                            </div>
                          )}
                          {child.date_of_birth && (
                            <div>
                              <p className="text-xs text-muted-foreground">Date of Birth</p>
                              <p className="font-medium text-sm">
                                {new Date(child.date_of_birth).toLocaleDateString()}
                              </p>
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
                          {child.phone_number && (
                            <div className="flex items-start">
                              <Bell className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                              <p className="text-muted-foreground">
                                Contact number: {child.phone_number}
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
                  <div className="border-b mb-4">
                    <nav className="-mb-px flex space-x-2 overflow-x-auto" role="tablist">
                      <button
                        onClick={() => setSelectedChildForAnnouncements('')}
                        className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                          selectedChildForAnnouncements === ''
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        role="tab"
                      >
                        All
                      </button>
                      {Object.keys(announcements.reduce((acc, ann) => {
                        if (!acc[ann.child_name]) acc[ann.child_name] = true;
                        return acc;
                      }, {} as Record<string, boolean>)).map((childName) => (
                        <button
                          key={childName}
                          onClick={() => setSelectedChildForAnnouncements(childName)}
                          className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                            selectedChildForAnnouncements === childName
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          role="tab"
                        >
                          {childName}
                        </button>
                      ))}
                    </nav>
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
                        <div key={childName} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-lg mb-3">{childName}</h4>
                          <div className="space-y-3">
                            {Object.entries(
                              anns.reduce((acc, ann) => {
                                const key = ann.announcement.teacher_name;
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(ann.announcement);
                                return acc;
                              }, {} as { [key: string]: AnnouncementData['announcement'][] })
                            ).map(([teacherName, teacherAnns]) => (
                              <div key={teacherName} className="bg-gray-50 rounded p-3">
                                <h5 className="font-medium text-sm text-gray-600 mb-2">From: {teacherName}</h5>
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
                  <div className="border-b mb-4">
                    <nav className="-mb-px flex space-x-2 overflow-x-auto" role="tablist">
                      <button
                        onClick={() => setSelectedChildForAttendance('')}
                        className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                          selectedChildForAttendance === ''
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        role="tab"
                      >
                        All
                      </button>
                      {attendance.map((att) => att.child_name).filter((name, i, arr) => arr.indexOf(name) === i).map((childName) => (
                        <button
                          key={childName}
                          onClick={() => setSelectedChildForAttendance(childName)}
                          className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                            selectedChildForAttendance === childName
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          role="tab"
                        >
                          {childName}
                        </button>
                      ))}
                    </nav>
                  </div>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto">
                    {childAttendance.length === 0 ? (
                      <p className="text-muted-foreground">No attendance records for {selectedChildForAttendance || 'any child'}</p>
                    ) : (
                      childAttendance.map((childData) => (
                        <div key={childData.child_name} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-lg">{childData.child_name}</h4>
                            <div className="flex gap-4">
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                <UserCheck className="inline h-4 w-4 mr-1" />
                                {childData.attendance.filter(r => r.status === 'PRESENT').length} Present
                              </span>
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                <UserX className="inline h-4 w-4 mr-1" />
                                {childData.attendance.filter(r => r.status === 'ABSENT').length} Absent
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {childData.attendance.map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
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
              {children.length === 0 ? (
                <p className="text-muted-foreground">No children linked to your account yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {children.map((child) => {
                    const prediction = predictions[child.id];
                    return (
                      <div key={child.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium text-lg">{child.full_name}</p>
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
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                              <div>
                                <p className="text-sm text-muted-foreground">Prediction</p>
                                <p className={`text-xl font-bold ${
                                  prediction.prediction === 'Dropout' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {prediction.prediction}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Confidence</p>
                                <p className="text-xl font-bold">
                                  {(prediction.confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <p className="text-sm font-medium mb-3">Features Used</p>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Absences</span>
                                  <span className="font-medium">{prediction.features_used.total_absences}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Absence Rate</span>
                                  <span className="font-medium">{(prediction.features_used.absence_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Exercises Completed</span>
                                  <span className="font-medium">{prediction.features_used.exercises_completed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Exercise Completion</span>
                                  <span className="font-medium">{(prediction.features_used.exercise_completion_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Critical Skill Completion</span>
                                  <span className="font-medium">{(prediction.features_used.critical_skill_completion_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Critical Skills Missed</span>
                                  <span className="font-medium">{prediction.features_used.total_critical_skills_missed}</span>
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
      </main>
    </div>
  );
}
