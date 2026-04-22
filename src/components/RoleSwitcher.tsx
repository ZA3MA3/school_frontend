import { useAuth, type UserRole } from '@/hooks/useAuth';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { UserCircle, Shield, GraduationCap, Users, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();
  const { t } = useTranslation();

  if (!user || user.roles.length <= 1) {
    return null;
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <Shield className="mr-2 h-4 w-4 text-red-500" />;
      case 'TEACHER': return <GraduationCap className="mr-2 h-4 w-4 text-blue-500" />;
      case 'STUDENT': return <Users className="mr-2 h-4 w-4 text-green-500" />;
      case 'PARENT': return <Baby className="mr-2 h-4 w-4 text-purple-500" />;
      default: return <UserCircle className="mr-2 h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return t('roles.admin', 'Administrator');
      case 'TEACHER': return t('roles.teacher', 'Teacher');
      case 'STUDENT': return t('roles.student', 'Student');
      case 'PARENT': return t('roles.parent', 'Parent');
      default: return role;
    }
  };

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t('common.switchRole', 'Switch Role')}</DropdownMenuLabel>
      {user.roles.map((role) => (
        <DropdownMenuItem
          key={role}
          onClick={() => switchRole(role)}
          disabled={role === activeRole}
          className={role === activeRole ? 'bg-accent/50 opacity-70 cursor-default' : 'cursor-pointer'}
        >
          {getRoleIcon(role)}
          <span>{getRoleLabel(role)}</span>
          {role === activeRole && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('common.active', 'Active')}
            </span>
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}
