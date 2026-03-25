import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SurfaceCard } from './src/shared/ui/SurfaceCard';

describe('SurfaceCard', () => {
  it('renders child content', () => {
    render(<SurfaceCard>Contenido clínico</SurfaceCard>);
    expect(screen.getByText('Contenido clínico')).toBeInTheDocument();
  });
});
