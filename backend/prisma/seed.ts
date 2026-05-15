import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.block.deleteMany();
  await prisma.accessRight.deleteMany();
  await prisma.note.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@syllanote.test' },
    update: {},
    create: {
      email: 'owner@syllanote.test',
      name: 'Владелец',
      passwordHash,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@syllanote.test' },
    update: {},
    create: {
      email: 'editor@syllanote.test',
      name: 'Редактор',
      passwordHash,
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: 'reader@syllanote.test' },
    update: {},
    create: {
      email: 'reader@syllanote.test',
      name: 'Читатель',
      passwordHash,
    },
  });

  const note1 = await prisma.note.create({
    data: {
      title: 'Лекция по архитектуре ПО',
      contentJson: {
        root: {
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Клиент-серверная архитектура...' }],
            },
          ],
        },
      },
      ownerId: owner.id,
      accessRights: {
        create: { userId: owner.id, role: Role.OWNER },
      },
      blocks: {
        create: {
          type: 'text',
          order: 0,
          content: { text: 'Введение' },
        },
      },
    },
    include: { blocks: true },
  });

  await prisma.accessRight.create({
    data: { userId: editor.id, noteId: note1.id, role: Role.EDITOR },
  });

  await prisma.accessRight.create({
    data: { userId: reader.id, noteId: note1.id, role: Role.READER },
  });

  const note2 = await prisma.note.create({
    data: {
      title: 'Совместный конспект группы',
      contentJson: {},
      ownerId: owner.id,
      accessRights: {
        create: [
          { userId: owner.id, role: Role.OWNER },
          { userId: editor.id, role: Role.COMMENTATOR },
        ],
      },
      blocks: {
        create: { type: 'text', order: 0, content: {} },
      },
    },
    include: { blocks: true },
  });

  const blockId = note2.blocks[0]?.id;
  if (blockId) {
    await prisma.comment.create({
      data: {
        text: 'Нужно добавить схему компонентов',
        userId: editor.id,
        noteId: note2.id,
        blockId,
      },
    });
  }

  console.log('Seed completed:', {
    users: [owner.email, editor.email, reader.email],
    notes: [note1.title, note2.title],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
