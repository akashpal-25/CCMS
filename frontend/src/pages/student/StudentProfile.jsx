import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { studentService } from '../../services/studentService';
import Card from '../../components/ui/Card';
import Loader from '../../components/common/Loader';

const StudentProfile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getMyProfile()
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => { setProfile(null); setLoading(false); });
  }, []);


  if (loading) return <Loader message="Loading your academic profile..." />;
  if (!profile) {
    return (
      <p style={{ padding: '2rem', color: 'var(--status-not-solved-text)' }}>
        Could not load profile. Please logout and login again.
      </p>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Student Profile</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Official academic enrollment records from university database.</p>
      </div>

      <Card style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700
          }}>
            {user?.full_name?.charAt(0)}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.full_name}</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Roll / ID: {profile?.student_id}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email Address</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{user?.email}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Department</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.department_name}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Program / Course</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.course_name}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Section</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.class_section || '—'}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Semester</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.semester || '—'}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Academic Session</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.academic_session || '—'}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Admission Year</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.admission_year || '—'}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.2rem' }}>{profile?.status}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudentProfile;