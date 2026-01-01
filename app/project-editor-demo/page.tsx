'use client';

import dynamic from 'next/dynamic';

const ProjectEditorDemo = dynamic(() => import('@/components/ProjectEditorDemo'), {
  ssr: false,
});

export default function ProjectEditorDemoPage() {
  return <ProjectEditorDemo />;
}

