-- Clear dummy data and keep database clean
USE alim_online;
GO

-- Delete all dummy alims and reviews
DELETE FROM dbo.reviews;
GO

DELETE FROM dbo.appointments;
GO

DELETE FROM dbo.alim_availability;
GO

DELETE FROM dbo.alims;
GO

DELETE FROM dbo.service_requests;
GO

DELETE FROM dbo.users;
GO

-- Reseed identity columns
DBCC CHECKIDENT ('dbo.alims', RESEED, 0);
DBCC CHECKIDENT ('dbo.users', RESEED, 0);
DBCC CHECKIDENT ('dbo.appointments', RESEED, 0);
DBCC CHECKIDENT ('dbo.reviews', RESEED, 0);
DBCC CHECKIDENT ('dbo.service_requests', RESEED, 0);
DBCC CHECKIDENT ('dbo.alim_availability', RESEED, 0);
GO

-- Keep services (these are real)
IF NOT EXISTS (SELECT 1 FROM dbo.services)
BEGIN
  INSERT INTO dbo.services (name, description) VALUES
  (N'Nikah', N'Marriage ceremony and Islamic marriage guidance'),
  (N'Dua', N'Prayer services and spiritual guidance'),
  (N'Janaza', N'Funeral prayer and Islamic burial guidance'),
  (N'Quran Khawani', N'Quran recitation for religious events'),
  (N'Family Counseling', N'Islamic family counseling and mediation'),
  (N'Quranic Study', N'Quran teaching and study sessions');
END;
GO

PRINT 'Database cleaned and reset for real data!';
