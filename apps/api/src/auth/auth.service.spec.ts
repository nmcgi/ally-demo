import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';

const mockUser: UserEntity = {
  id: 'user-uuid',
  email: 'test@example.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  const mockRepo = { findOne: jest.fn() };
  const mockJwt = { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() };
  const mockConfig = { getOrThrow: jest.fn().mockReturnValue('secret') };
  const mockUsersService = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const hash = await bcrypt.hash('password123', 1);
      mockRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual({ id: mockUser.id, email: mockUser.email, role: mockUser.role });
    });

    it('returns null when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.validateUser('x@x.com', 'pw')).toBeNull();
    });

    it('returns null when password is wrong', async () => {
      const hash = await bcrypt.hash('correct', 1);
      mockRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });
      expect(await service.validateUser('test@example.com', 'wrong')).toBeNull();
    });
  });

  describe('register', () => {
    it('creates the user and returns tokens', async () => {
      const { passwordHash: _, ...created } = mockUser;
      mockUsersService.create.mockResolvedValue(created);

      const result = await service.register({
        email: mockUser.email,
        password: 'password123',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: mockUser.email }),
      );
      expect(result).toMatchObject({ accessToken: 'token', refreshToken: 'token', expiresIn: 900 });
    });
  });

  describe('login', () => {
    it('returns tokens', async () => {
      const result = await service.login({ id: 'id', email: 'e@e.com', role: 'customer' });
      expect(result).toMatchObject({ accessToken: 'token', refreshToken: 'token', expiresIn: 900 });
    });
  });

  describe('refresh', () => {
    it('throws on invalid token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error(); });
      await expect(service.refresh('bad')).rejects.toThrow(UnauthorizedException);
    });
  });
});
