import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { parentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, LogOut, Bell, BookOpen, MessageSquare } from 'lucide-react';
import Chat from '@/components/Chat';

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

export default function ParentDashboard() {
  const { logout, user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [childrenData, announcementsData] = await Promise.all([
        parentApi.getChildren(),
        parentApi.getAnnouncements(),
      ]);
      setChildren(childrenData);
      setAnnouncements(announcementsData);
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Announcements for your children</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-muted-foreground">No announcements yet</p>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto">
                {Object.entries(
                  announcements.reduce((acc, ann) => {
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
}
