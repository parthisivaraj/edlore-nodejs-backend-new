// require('dotenv').config();
// import { DataSource, QueryRunner, Repository } from 'typeorm';
// import {
//   Part,
//   PartFields,
// } from '@app/schema';

// const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.POSTGRES_HOST,
//   port: parseInt(process.env.POSTGRES_PORT || '5432'),
//   username: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD,
//   database: process.env.POSTGRES_DATABASE,
//   synchronize: false,
//   logging: false,
//   entities: [Part,PartFields],
// });

// async function updateParts() {
//   const partsRepo = AppDataSource.getRepository(Part);

//   // Step 1: Fetch all parts 
//   const parts = await partsRepo.find();

//   // Step 2: Loop and update
//   for (const part of parts) {
//     console.log('-----',part)
//     //user.name = ${user.name} [Updated];
//     //await userRepo.save(user); // Save updated user
//   }

//   console.log(`✅ Updated ${parts.length} parts.`);
// }
// updateParts()