jest.mock('../dao/lessons.dao', () => ({
  LessonsDao: { getLessons: jest.fn(), deleteLesson: jest.fn(), getLessonById: jest.fn() },
}));

import { LessonsDao } from '../dao/lessons.dao';
import { LessonsService } from './lessons.service';

const dao = LessonsDao as jest.Mocked<typeof LessonsDao>;

describe('LessonsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s4/@s7 — list maps DAO rows; RLS + logout/login survival are DB-side.
  it('getLessons maps raw DAO rows to LessonSummary', async () => {
    dao.getLessons.mockResolvedValue([
      { id: 'lesson-2', title: 'Newer', created_at: '2026-07-13T12:00:00.000Z' },
      { id: 'lesson-1', title: 'Older', created_at: '2026-07-12T12:00:00.000Z' },
    ]);

    const result = await LessonsService.getLessons();

    expect(dao.getLessons).toHaveBeenCalledWith();
    expect(result).toEqual([
      { id: 'lesson-2', title: 'Newer', createdAt: '2026-07-13T12:00:00.000Z' },
      { id: 'lesson-1', title: 'Older', createdAt: '2026-07-12T12:00:00.000Z' },
    ]);
  });

  it('getLessons normalizes a DAO failure into a typed network_error', async () => {
    dao.getLessons.mockRejectedValue({ message: 'select failed' });

    await expect(LessonsService.getLessons()).rejects.toMatchObject({
      code: 'network_error',
      message: 'LessonsService.getLessons: failed to load lessons',
    });
  });

  // @s8 — delete validates id then delegates; empty id never hits the DAO.
  it('deleteLesson rejects an empty id without calling the DAO', async () => {
    await expect(LessonsService.deleteLesson('')).rejects.toMatchObject({
      code: 'validation_error',
    });
    await expect(LessonsService.deleteLesson('   ')).rejects.toMatchObject({
      code: 'validation_error',
    });
    expect(dao.deleteLesson).not.toHaveBeenCalled();
  });

  // @s8/@s12 — valid id delegates to LessonsDao.deleteLesson (RLS scopes ownership).
  it('deleteLesson delegates a valid id to LessonsDao.deleteLesson', async () => {
    dao.deleteLesson.mockResolvedValue(undefined);

    await LessonsService.deleteLesson('lesson-1');

    expect(dao.deleteLesson).toHaveBeenCalledWith('lesson-1');
  });

  it('deleteLesson normalizes a DAO failure into a typed network_error', async () => {
    dao.deleteLesson.mockRejectedValue({ message: 'delete failed' });

    await expect(LessonsService.deleteLesson('lesson-1')).rejects.toMatchObject({
      code: 'network_error',
      message: 'LessonsService.deleteLesson: failed to delete lesson',
    });
  });

  // @s17 feed — getLesson validates id, delegates, normalizes failure.
  it('getLesson rejects an empty id without calling the DAO', async () => {
    await expect(LessonsService.getLesson('')).rejects.toMatchObject({ code: 'validation_error' });
    await expect(LessonsService.getLesson('   ')).rejects.toMatchObject({
      code: 'validation_error',
    });
    expect(dao.getLessonById).not.toHaveBeenCalled();
  });

  it('getLesson maps a valid id raw row from LessonsDao.getLessonById', async () => {
    dao.getLessonById.mockResolvedValue({
      id: 'lesson-1',
      title: 'Capitals',
      slides: [],
      created_at: '2026-07-12T12:00:00.000Z',
      user_id: 'user-1',
    });

    const result = await LessonsService.getLesson('lesson-1');

    expect(dao.getLessonById).toHaveBeenCalledWith('lesson-1');
    expect(result).toEqual({
      id: 'lesson-1',
      userId: 'user-1',
      title: 'Capitals',
      createdAt: '2026-07-12T12:00:00.000Z',
      slides: [],
    });
  });

  it('getLesson normalizes a DAO failure into a typed network_error', async () => {
    dao.getLessonById.mockRejectedValue({ message: 'not found' });

    await expect(LessonsService.getLesson('lesson-1')).rejects.toMatchObject({
      code: 'network_error',
      message: 'LessonsService.getLesson: failed to load lesson',
    });
  });
});
