import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { schoolApi } from '@/lib/school-api';
import { isSchoolFeatureAccessible } from '@/lib/feature-flags';
import type {
  School,
  SchoolCalendar,
  SchoolMember,
  SchoolJoinResult,
} from '@/types/school';

interface SchoolContextType {
  school: School | null;
  schoolMember: SchoolMember | null;
  schoolCalendar: SchoolCalendar | null;
  isLoading: boolean;
  isSchoolActive: boolean;
  isPending: boolean;
  isWaka: boolean;
  isKepsek: boolean;
  isGuru: boolean;
  isFeatureAllowed: boolean;
  refreshSchool: () => Promise<void>;
  fetchCalendar: (academicYear: string, semester: 1 | 2) => Promise<SchoolCalendar | null>;
  joinSchool: (npsn: string) => Promise<SchoolJoinResult>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Tahun ajaran berjalan di Indonesia: semester 1 mulai pertengahan Juli.
// Jul–Des = y/y+1, Jan–Jun = y-1/y.
const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    return {
      school: null,
      schoolMember: null,
      schoolCalendar: null,
      isLoading: false,
      isSchoolActive: false,
      isPending: false,
      isWaka: false,
      isKepsek: false,
      isGuru: false,
      isFeatureAllowed: false,
      refreshSchool: async () => {},
      fetchCalendar: async () => null,
      joinSchool: async () => ({ success: false, message: '' }),
    };
  }
  return context;
};

interface SchoolProviderProps {
  children: ReactNode;
}

export const SchoolProvider: React.FC<SchoolProviderProps> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [schoolMember, setSchoolMember] = useState<SchoolMember | null>(null);
  const [schoolCalendar, setSchoolCalendar] = useState<SchoolCalendar | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isFeatureAllowed = isSchoolFeatureAccessible(user?.email, isAdmin);

  const refreshSchool = useCallback(async () => {
    if (!user) {
      setSchool(null);
      setSchoolMember(null);
      setSchoolCalendar(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const memberProfile = await schoolApi.getCurrentUserProfile();
      setSchoolMember(memberProfile);

      if (memberProfile?.school_id) {
        const schoolDetails = await schoolApi.getSchoolById(memberProfile.school_id);
        setSchool(schoolDetails);

        // Jika sekolah aktif dan punya tahun ajaran aktif, ambil kalender semester 1 sebagai default
        if (schoolDetails) {
          const currentYear = schoolDetails.academic_year_active || getCurrentAcademicYear();
          const cal = await schoolApi.getSchoolCalendar(schoolDetails.id, currentYear, 1);
          setSchoolCalendar(cal);
        } else {
          setSchoolCalendar(null);
        }
      } else {
        setSchool(null);
        setSchoolCalendar(null);
      }
    } catch (err) {
      console.error('Error refreshing school context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshSchool();
  }, [refreshSchool]);

  const fetchCalendar = useCallback(
    async (academicYear: string, semester: 1 | 2): Promise<SchoolCalendar | null> => {
      if (!school?.id) return null;
      return await schoolApi.getSchoolCalendar(school.id, academicYear, semester);
    },
    [school?.id]
  );

  const joinSchool = useCallback(
    async (npsn: string): Promise<SchoolJoinResult> => {
      const result = await schoolApi.requestJoinSchool(npsn);
      if (result.success) {
        await refreshSchool();
      }
      return result;
    },
    [refreshSchool]
  );

  const isSchoolActive = Boolean(
    school && schoolMember?.school_status === 'active'
  );
  const isPending = Boolean(schoolMember?.school_status === 'pending');
  const isWaka = Boolean(isSchoolActive && schoolMember?.school_role === 'waka');
  const isKepsek = Boolean(isSchoolActive && schoolMember?.school_role === 'kepsek');
  const isGuru = Boolean(isSchoolActive && schoolMember?.school_role === 'guru');

  return (
    <SchoolContext.Provider
      value={{
        school,
        schoolMember,
        schoolCalendar,
        isLoading,
        isSchoolActive,
        isPending,
        isWaka,
        isKepsek,
        isGuru,
        isFeatureAllowed,
        refreshSchool,
        fetchCalendar,
        joinSchool,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};
