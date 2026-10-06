import {
  ClinicalDocumentVersioningService,
  type ClinicalVersionPort,
  type VersionedClinicalRecord,
} from './clinical-document-versioning.service';

interface FakeNote extends VersionedClinicalRecord {
  parentId: string;
  text: string;
}

class InMemoryNotePort implements ClinicalVersionPort<FakeNote, { text: string }> {
  private sequence = 0;
  readonly store = new Map<string, FakeNote>();

  async findCurrentDraft(parentId: string): Promise<FakeNote | null> {
    return (
      [...this.store.values()].find(
        (note) => note.parentId === parentId && note.status === 'DRAFT',
      ) ?? null
    );
  }

  async findLatestFinalized(parentId: string): Promise<FakeNote | null> {
    const finalized = [...this.store.values()]
      .filter((note) => note.parentId === parentId && note.status === 'FINALIZED')
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return finalized[0] ?? null;
  }

  async createInitialDraft(parentId: string, input: { text: string }): Promise<FakeNote> {
    const note: FakeNote = {
      id: `note-${++this.sequence}`,
      parentId,
      status: 'DRAFT',
      versionNumber: 1,
      previousVersionId: null,
      text: input.text,
    };
    this.store.set(note.id, note);
    return note;
  }

  async updateDraft(document: FakeNote, input: { text: string }): Promise<FakeNote> {
    const updated = { ...document, text: input.text };
    this.store.set(updated.id, updated);
    return updated;
  }

  async finalize(document: FakeNote): Promise<FakeNote> {
    const updated: FakeNote = { ...document, status: 'FINALIZED' };
    this.store.set(updated.id, updated);
    return updated;
  }

  async createVersionFromFinalized(
    previous: FakeNote,
    input: { text: string },
  ): Promise<FakeNote> {
    const note: FakeNote = {
      id: `note-${++this.sequence}`,
      parentId: previous.parentId,
      status: 'DRAFT',
      versionNumber: previous.versionNumber + 1,
      previousVersionId: previous.id,
      text: input.text,
    };
    this.store.set(note.id, note);
    return note;
  }
}

describe('ClinicalDocumentVersioningService', () => {
  const parentId = 'episode-1';
  let service: ClinicalDocumentVersioningService;
  let port: InMemoryNotePort;

  beforeEach(() => {
    service = new ClinicalDocumentVersioningService();
    port = new InMemoryNotePort();
  });

  it('crea la versión 1 al primer guardado y la reutiliza en guardados posteriores (regla 0.4)', async () => {
    const first = await service.saveDraft(port, parentId, { text: 'a' });
    const second = await service.saveDraft(port, parentId, { text: 'b' });

    expect(first.id).toBe(second.id);
    expect(second.versionNumber).toBe(1);
    expect(port.store.size).toBe(1);
  });

  it('no permite finalizar si no hay borrador', async () => {
    await expect(service.finalize(port, parentId)).rejects.toThrow(
      'No existe una versión en Borrador para finalizar.',
    );
  });

  it('bloquea UPDATE/DELETE sobre una versión Finalizada (regla 0.2)', async () => {
    const draft = await service.saveDraft(port, parentId, { text: 'a' });
    const finalized = await service.finalize(port, parentId);

    expect(finalized.id).toBe(draft.id);
    expect(finalized.status).toBe('FINALIZED');
    expect(() => service.assertEditable(finalized)).toThrow(
      'La versión está Finalizada y es inmutable; no se puede editar ni eliminar.',
    );
  });

  it('no permite crear una nueva versión mientras exista un borrador (regla 0.4)', async () => {
    await service.saveDraft(port, parentId, { text: 'a' });

    await expect(
      service.createNewVersion(port, parentId, { text: 'b' }),
    ).rejects.toThrow(
      'Ya existe una versión en Borrador; debe finalizarse antes de crear una nueva versión.',
    );
  });

  it('crea una nueva versión solo a partir de la última Finalizada, conservando previousVersionId', async () => {
    await service.saveDraft(port, parentId, { text: 'a' });
    await service.finalize(port, parentId);

    const v2 = await service.createNewVersion(port, parentId, { text: 'b' });

    expect(v2.versionNumber).toBe(2);
    expect(v2.status).toBe('DRAFT');
    expect(v2.previousVersionId).not.toBeNull();
  });
});
