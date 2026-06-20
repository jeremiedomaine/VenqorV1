-- Modèle Word (DOCX) avec variables pour fusion contrat

alter table public.workspaces
  add column if not exists contrat_template_docx_path text,
  add column if not exists contrat_template_docx_filename text,
  add column if not exists contrat_template_docx_updated_at timestamptz,
  add column if not exists contrat_template_mode text
    check (contrat_template_mode is null or contrat_template_mode in ('docx', 'pdf'));

comment on column public.workspaces.contrat_template_docx_path is
  'Chemin Storage workspace-contrats/{workspace_id}/contrat.docx';
comment on column public.workspaces.contrat_template_mode is
  'docx = fusion variables à l''envoi ; pdf = PDF statique uploadé';

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'workspace-contrats';
