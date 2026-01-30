# UXIAServer
Servidor Node/Sequelize/MySQL projecte UXIA

CREATE TABLE user 
(id INT AUTO_INCREMENT PRIMARY KEY, 
nickname VARCHAR(50) NOT NULL, 
telephone INT, email VARCHAR(100) NOT NULL, 
role VARCHAR(20) NOT NULL);

INSERT INTO users (nickname, telephone, email, role)
VALUES ('testAdmin', '654212324', 'testAdmin@email.com', 'admin');