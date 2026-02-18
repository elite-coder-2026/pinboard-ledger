export const attachment_queries = {
  listByUser: `
    SELECT a.id, a.note_id, a.file_name, a.file_type, a.file_size, a.mime_type, a.created_at
    FROM pl.attachments a
    JOIN pl.notes n ON n.id = a.note_id
    WHERE n.user_id = $1
    ORDER BY a.created_at DESC
    LIMIT $2 OFFSET $3
  `,
  listByUserAndNote: `
    SELECT a.id, a.note_id, a.file_name, a.file_type, a.file_size, a.mime_type, a.created_at
    FROM pl.attachments a
    JOIN pl.notes n ON n.id = a.note_id
    WHERE n.user_id = $1 AND a.note_id = $2
    ORDER BY a.created_at DESC
    LIMIT $3 OFFSET $4
  `,
  getById: `
    SELECT a.id,
           a.note_id,
           a.file_name,
           a.file_type,
           a.file_size,
           a.mime_type,
           a.file_data,
           a.created_at
    FROM pl.attachments a
    JOIN pl.notes n ON n.id = a.note_id
    WHERE a.id = $1 AND n.user_id = $2
  `,
  create: `
    INSERT INTO pl.attachments (note_id, file_name, file_type, file_size, mime_type, file_data)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, note_id, file_name, file_type, file_size, mime_type, created_at
  `,
  update: `
    UPDATE pl.attachments a
    SET file_name = $3,
        file_type = $4,
        file_size = $5,
        mime_type = $6,
        file_data = $7
    FROM pl.notes n
    WHERE a.id = $1 AND n.id = a.note_id AND n.user_id = $2
    RETURNING a.id, a.note_id, a.file_name, a.file_type, a.file_size, a.mime_type, a.file_data, a.created_at
  `,
  remove: `
    DELETE FROM pl.attachments a
    USING pl.notes n
    WHERE a.id = $1 AND n.id = a.note_id AND n.user_id = $2
    RETURNING a.id
  `,
};
