import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCourse } from '../../api/courses';
import { StudentsTab } from './StudentsTab';
import { TasksTab } from './TasksTab';
import { NewTaskModal } from './NewTaskModal';

type ActiveTab = 'alumnos' | 'tareas';

const TABS: { label: string; value: ActiveTab }[] = [
  { label: 'Alumnos', value: 'alumnos' },
  { label: 'Tareas', value: 'tareas' },
];

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    searchParams.get('tab') === 'tareas' ? 'tareas' : 'alumnos'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (!courseId) return;
    getCourse(courseId).then((c) => setCourseName(`${c.name} — ${c.shift}`));
  }, [courseId]);

  if (!courseId) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Curso</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>{courseName}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f3f4f6', paddingBottom: 0 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #00b89c' : '2px solid transparent',
                marginBottom: -2,
                color: isActive ? '#00b89c' : '#6b7280',
                fontWeight: isActive ? 700 : 400,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab activo */}
      {activeTab === 'alumnos' && (
        <StudentsTab courseId={courseId} />
      )}

      {activeTab === 'tareas' && (
        <TasksTab
          courseId={courseId}
          onAdd={() => setIsModalOpen(true)}
          refreshKey={refreshKey}
        />
      )}

      {/* Modal wizard */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseName={courseName}
        courseId={Number(courseId)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
