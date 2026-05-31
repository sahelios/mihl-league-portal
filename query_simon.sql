SELECT 
  ra.id,
  ra.email,
  ra.role,
  ra.status,
  ra.selectedGames,
  ra.userId,
  u.email as userEmail
FROM refereeApplications ra
LEFT JOIN users u ON ra.userId = u.id
WHERE ra.email LIKE '%simon%' OR u.email LIKE '%simon%';
