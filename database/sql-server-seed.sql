USE alim_online;
GO

-- Only seed essential services (these are real service types)
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

-- Alims will register themselves through the app
-- No dummy alim data - keep database clean for real users
