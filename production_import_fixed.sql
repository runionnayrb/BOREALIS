-- ================================================
-- PRODUCTION DATABASE IMPORT SCRIPT
-- ================================================
-- This script contains all settings data from development
-- Run this in your PRODUCTION database using the Database pane
-- 
-- IMPORTANT: Run these commands in order!
-- ================================================

-- Optional: Clear existing settings (uncomment if needed)
-- TRUNCATE scenes, acts, departments, location_types, locations, artist_groups, artists, technicians, technician_departments, report_template, scene_departments, act_departments, scene_artists, act_artists CASCADE;

-- ================================================
-- SCENES
-- ================================================
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('da773699-42c0-4aea-89ca-596178faf7c1', 'PROLOGUE', 0, '2025-10-10 20:05:57.658473');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('93ca94c1-217c-4def-8cde-53d561cc01e9', 'DESERT FLOWER', 1, '2025-10-10 20:06:12.009114');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('79583e64-d340-47bb-a19d-22dc6c0f88be', 'FULL SHOW', 2, '2025-10-10 21:45:59.907317');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('99818997-3bbd-4dfc-882d-12453e20a31d', 'RESCUE SCENARIOS', 3, '2025-10-10 21:46:48.87469');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('90c3275a-3b2b-4bee-b334-404905a55e76', 'CITY OPERA', 4, '2025-10-12 09:38:22.0288');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('ff7f61eb-a4f7-4ee8-8681-4909c2604154', 'TOWERBRIDGE', 5, '2025-10-12 09:38:30.002398');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('4156afb8-9919-4d17-81ba-6db5ea29475e', 'THE PORTAL', 6, '2025-10-12 09:55:51.532833');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('d2c9caa5-6d37-46cc-8d5f-ad5165d04c4a', 'CHAPELLE', 7, '2025-10-12 09:38:36.726897');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('ad2dd67a-fa76-487b-bc3a-3baccda5e0d8', 'SET THE WORLD', 8, '2025-10-12 09:38:43.01095');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('e14a6f47-8764-4d4f-a74c-41690ac8c854', 'CASTLE', 9, '2025-10-12 09:38:51.956808');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('f90c2a0f-921e-4ab1-9b68-104da0736137', 'JEWEL BOX', 10, '2025-10-12 09:39:01.238396');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('5b3ad1bb-d82f-4a86-834f-2c065f33dab8', 'SHADOWS', 11, '2025-10-12 09:39:07.532792');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('a3343bf0-9171-4a52-ade5-1bd68eb1318d', 'PILLARS', 12, '2025-10-12 09:39:14.232981');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('14667872-59ee-4e29-bd78-ea32641eadc5', 'CAPTURE', 13, '2025-10-12 09:39:19.157841');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('2e34b0e3-c76c-4b6a-a488-b9d054245a2c', 'SEASONS', 14, '2025-10-12 09:39:25.576686');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('3f0e1584-6dec-434f-b73e-c063e906f2cc', 'COSMOS', 15, '2025-10-12 09:39:33.310352');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('df91fa92-7114-4e32-a0e5-70462b68401f', 'SURRENDER', 16, '2025-10-12 09:39:39.13176');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('78a5bbf4-21e5-4561-9a88-90f1bd2cf6f1', 'STORM', 17, '2025-10-12 09:39:44.431375');
INSERT INTO scenes (id, name, sort_order, created_at) VALUES ('68a4593d-35c5-4b25-9f30-a5b36c22ac33', 'FINALE', 18, '2025-10-12 09:40:16.210294');

-- ================================================
-- ACTS
-- ================================================
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('6567acce-62ff-40bf-87b7-543458dcf7d8', 'Heaven', '14667872-59ee-4e29-bd78-ea32641eadc5', 20, '2025-10-12 10:05:25.309408');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('dd89af21-487e-4f44-9d90-7fa1fb7bd962', 'Bungee Straps', '14667872-59ee-4e29-bd78-ea32641eadc5', 21, '2025-10-12 10:05:32.835862');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('a6d9ee3b-dc0a-4f43-af19-fce3e9e0bba2', 'Silks', '2e34b0e3-c76c-4b6a-a488-b9d054245a2c', 22, '2025-10-12 10:05:49.20602');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('5328a9c0-3cd6-4e93-a56f-c77e2148582f', 'Eden', '2e34b0e3-c76c-4b6a-a488-b9d054245a2c', 23, '2025-10-12 10:06:00.446235');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('2df2d4b1-14e1-46f6-9a95-65c98af7b656', 'Wheel of LIfe', '3f0e1584-6dec-434f-b73e-c063e906f2cc', 24, '2025-10-12 10:06:14.820708');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('8d2209bb-a76e-4a11-83ac-76a60bbd51e3', 'Acro Poles', '3f0e1584-6dec-434f-b73e-c063e906f2cc', 25, '2025-10-12 10:06:26.394808');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('7270b069-a3a5-4635-8f00-65a02896b106', 'Creature Reveal', '4156afb8-9919-4d17-81ba-6db5ea29475e', 6, '2025-10-12 09:58:34.194897');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('3507ab7d-6eef-4d46-b550-c1822f2a9a29', 'Kung Fu', '5b3ad1bb-d82f-4a86-834f-2c065f33dab8', 15, '2025-10-12 10:03:13.669868');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('aed0f660-ba6f-49d0-90da-6c382fb5b07b', 'Monster', '5b3ad1bb-d82f-4a86-834f-2c065f33dab8', 16, '2025-10-12 10:03:34.952678');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('673524d5-98f6-4896-83bb-7ebf803707b3', 'Taiko Drum', '68a4593d-35c5-4b25-9f30-a5b36c22ac33', 30, '2025-10-12 10:07:35.19086');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('e5dff373-98f8-49fc-a6ad-c18007fd41d1', 'Cerceaux', '68a4593d-35c5-4b25-9f30-a5b36c22ac33', 31, '2025-10-12 10:07:43.375057');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('f077eaa1-63cb-4d21-9c3f-bd8780f7f36d', 'Pole Dive', '68a4593d-35c5-4b25-9f30-a5b36c22ac33', 32, '2025-10-12 10:07:51.538326');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('d71ad0b2-287b-4641-95c4-52932d262bdf', 'Storm', '78a5bbf4-21e5-4561-9a88-90f1bd2cf6f1', 28, '2025-10-12 10:07:03.087337');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('d3bc28ec-6f97-4482-b649-14b4d852eb37', 'Goodbyes', '78a5bbf4-21e5-4561-9a88-90f1bd2cf6f1', 29, '2025-10-12 10:07:12.254964');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'FULL SHOW CONDITIONS', '79583e64-d340-47bb-a19d-22dc6c0f88be', 2, '2025-10-10 21:45:52.418285');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('6b3ff452-e4ad-48dc-8c26-cc1d796f3f2e', 'Suspended Poles', '90c3275a-3b2b-4bee-b334-404905a55e76', 3, '2025-10-12 09:51:54.642516');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('977acc70-fe99-4caf-8957-893f8ba62efd', 'Inverted Walks', '90c3275a-3b2b-4bee-b334-404905a55e76', 4, '2025-10-12 09:54:20.362102');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('2abe430c-c88f-4c11-bb7f-6e7bd01780cd', 'Hair Hanging', '93ca94c1-217c-4def-8cde-53d561cc01e9', 0, '2025-10-10 20:06:31.390302');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('138f2c52-0c2a-4504-9ad5-a2d22d990cb9', 'Lion Dance', 'a3343bf0-9171-4a52-ade5-1bd68eb1318d', 17, '2025-10-12 10:04:12.247107');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('c15453a3-2a84-4514-aa24-efdc3247d178', 'Banquine', 'a3343bf0-9171-4a52-ade5-1bd68eb1318d', 18, '2025-10-12 10:04:22.277316');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('5a879c94-bb40-4317-ab30-0e1a5f1835d4', 'Dry Ice Basket', 'a3343bf0-9171-4a52-ade5-1bd68eb1318d', 19, '2025-10-12 10:04:39.512617');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('bb8004cb-835d-4e96-a708-dae9c73eb506', 'Chapelle Intro', 'd2c9caa5-6d37-46cc-8d5f-ad5165d04c4a', 7, '2025-10-12 10:01:03.640984');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('3f21ab57-0745-47ae-ab99-bef2f9647fba', 'Chapelle', 'd2c9caa5-6d37-46cc-8d5f-ad5165d04c4a', 8, '2025-10-12 10:01:15.901751');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('45fb5b7b-1134-4204-a9e1-86a0d991160a', 'Chapelle Exit', 'd2c9caa5-6d37-46cc-8d5f-ad5165d04c4a', 9, '2025-10-12 10:01:32.76382');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('d2ac16b8-ed63-4187-ae7a-e66707c5fa1e', 'Pre-Show', 'da773699-42c0-4aea-89ca-596178faf7c1', 1, '2025-10-10 20:06:46.182465');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('ff7ed012-432b-437e-9de6-5294fd873ec0', 'Kidnap', 'df91fa92-7114-4e32-a0e5-70462b68401f', 26, '2025-10-12 10:06:37.597597');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('b7fba898-f32a-4fbd-82f2-c882d2719316', 'Globe of Death', 'df91fa92-7114-4e32-a0e5-70462b68401f', 27, '2025-10-12 10:06:45.121466');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('a4123761-c43c-4f57-b120-c5cde3c78f3c', 'Jungle Gym', 'e14a6f47-8764-4d4f-a74c-41690ac8c854', 10, '2025-10-12 10:01:47.183922');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('c4ab0bc3-312e-496e-ba9e-dcd2e34cafc7', 'Slackline', 'e14a6f47-8764-4d4f-a74c-41690ac8c854', 11, '2025-10-12 10:01:56.585336');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('d245e0bc-2d5f-4107-88b2-f4418c1e9ee1', 'Robot Kuka Drum', 'f90c2a0f-921e-4ab1-9b68-104da0736137', 12, '2025-10-12 10:02:15.320252');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('a278e9ac-e116-4c0d-939c-15ca97bba8a0', 'Ladder Dive', 'f90c2a0f-921e-4ab1-9b68-104da0736137', 13, '2025-10-12 10:02:23.221874');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('fc0d8964-f744-4424-8cb8-6ddd8aa33476', 'Chase', 'f90c2a0f-921e-4ab1-9b68-104da0736137', 14, '2025-10-12 10:02:30.338293');
INSERT INTO acts (id, name, scene_id, sort_order, created_at) VALUES ('5a24f592-00ac-42e1-8fb9-019560036c75', 'Towerbridge', 'ff7f61eb-a4f7-4ee8-8681-4909c2604154', 5, '2025-10-12 09:55:22.546106');

-- ================================================
-- DEPARTMENTS
-- ================================================
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('155b0ed0-6820-434c-bc7b-4f57a8d670a8', 'Automation - Aerial', 0, '2025-10-10 19:49:45.815933');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('bd07048c-5133-4613-8990-b9be0023f08a', 'Aquatics', 2, '2025-10-10 19:50:18.486018');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('47ced0a9-5d4f-47c9-8460-be55b6024f1f', 'Carpentry', 2, '2025-10-10 19:50:29.381827');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('677b7ac5-f962-4ad9-a975-d490894712c8', 'Coaching', 3, '2025-10-10 19:51:02.89109');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('95852aae-5228-404f-8d91-00f677f785f3', 'Lighting', 4, '2025-10-10 19:51:14.436446');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('929a3866-43be-4b73-9f3a-20889e2bb487', 'Performance Wellness - PWD', 5, '2025-10-10 19:51:32.143277');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('d3aa7d41-e7d9-4891-b209-81bfb037b184', 'Rigging', 6, '2025-10-10 19:51:53.537408');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('d16199e9-7c76-4b25-b76b-b8a15a926c08', 'Sound', 7, '2025-10-10 19:51:57.720837');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('b271e2ca-1e7c-4ce9-bda3-0425582f66da', 'Special Effects - SFX', 8, '2025-10-10 19:52:11.184935');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('c35c5136-e744-446c-a986-2ac61eafe05a', 'Video', 9, '2025-10-10 19:52:16.115977');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('74c8282d-719d-4e93-a341-a3ed7fc9c7b9', 'Wardrobe', 10, '2025-10-10 19:52:28.737978');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('ce95b423-b2c9-4ede-b30f-c400046d993c', 'Automation - Scenic', 12, '2025-10-11 11:05:09.264284');
INSERT INTO departments (id, name, sort_order, created_at) VALUES ('d06cc4f6-4616-41d1-b6a4-3d4672dffcb7', 'Automation - Grid', 13, '2025-10-11 12:37:48.406554');

-- ================================================
-- LOCATION TYPES
-- ================================================
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('2a4e53a3-71b0-4b72-93b1-5722cf31455c', 'ONSTAGE', 0, '2025-10-10 16:39:29.90104');
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('b5e867c6-b69f-4187-b7f7-6472c0a6c4b3', 'TRAINING ROOM', 1, '2025-10-10 16:40:55.21242');
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('8a72ab73-0480-472e-ade3-99a4629c7b73', 'DANCE STUDIO', 2, '2025-10-10 16:41:10.593206');
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('4d36db9a-593c-4fba-bd20-1f1ecb5764c4', 'OFFSTAGE VARIOUS', 3, '2025-10-10 16:41:17.299184');
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('df9ddd0f-0836-4ffa-8921-ad2ad5539d1b', 'MEETINGS', 4, '2025-10-10 18:45:42.884897');
INSERT INTO location_types (id, name, sort_order, created_at) VALUES ('7d227911-7985-4ee6-8c1d-7224892745bc', 'COSTUME & MAKEUP', 5, '2025-10-10 18:49:18.544527');

-- ================================================
-- LOCATIONS
-- ================================================
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('ff551fd9-dcfd-4564-8aaf-6bdc8305113f', 'Drystage', '2a4e53a3-71b0-4b72-93b1-5722cf31455c', 0, '2025-10-10 16:25:47.628957');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('5df1eac2-bdb7-4df0-aaa1-1c722f0c5378', 'Upstage', '2a4e53a3-71b0-4b72-93b1-5722cf31455c', 1, '2025-10-10 16:25:55.267548');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('7b7cc877-bf85-4891-9a55-6764deb4ef8f', 'Pool', '2a4e53a3-71b0-4b72-93b1-5722cf31455c', 2, '2025-10-10 16:25:59.583026');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('721722ee-c5b1-4d97-9919-0f77e6f497ec', 'Downstage', '2a4e53a3-71b0-4b72-93b1-5722cf31455c', 3, '2025-10-10 16:26:08.905572');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('e6af786f-e316-45d5-8013-aa20a191fcfe', 'P2 Rigging', '4d36db9a-593c-4fba-bd20-1f1ecb5764c4', 4, '2025-10-10 18:43:12.567488');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('cf8170f6-bac1-4396-bc71-d6f4687ad6e3', 'B2 Wardrobe', '7d227911-7985-4ee6-8c1d-7224892745bc', 11, '2025-10-10 18:49:41.267719');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('a9728122-53c6-403c-b81a-59c97c452bba', 'Dance Studio', '8a72ab73-0480-472e-ade3-99a4629c7b73', 5, '2025-10-10 18:43:33.631584');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('7d93d5c1-3b01-4b19-8f99-ef1681a44e43', 'Zone A - Floor Area A', 'b5e867c6-b69f-4187-b7f7-6472c0a6c4b3', 6, '2025-10-10 18:44:06.695093');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('88f7ec27-cc59-45c4-8aff-eb07b45a379c', 'Zone B - Floor Area B', 'b5e867c6-b69f-4187-b7f7-6472c0a6c4b3', 7, '2025-10-10 18:44:17.520019');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('9c2dc95b-67e1-452f-8baf-b73135e50fef', 'Zone C - Trompoline', 'b5e867c6-b69f-4187-b7f7-6472c0a6c4b3', 8, '2025-10-10 18:44:30.322478');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('14a3563e-9cc4-4595-ab5c-5c4741208a33', 'B3 Coaching', 'df9ddd0f-0836-4ffa-8921-ad2ad5539d1b', 9, '2025-10-10 18:45:56.848055');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('f525e3f0-5869-49a9-baf5-deb55f9a3800', 'B2 Stage Management', 'df9ddd0f-0836-4ffa-8921-ad2ad5539d1b', 10, '2025-10-10 18:46:32.066479');
INSERT INTO locations (id, name, location_type_id, sort_order, created_at) VALUES ('678afa48-0291-46c2-ad2f-02ef9a1e6b89', 'B2 Resident Artistic Director', 'df9ddd0f-0836-4ffa-8921-ad2ad5539d1b', 12, '2025-10-10 22:04:06.034344');


-- ================================================
-- ARTIST GROUPS
-- ================================================
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('e358113f-312e-4df5-93ed-8ab41c646595', 'CHARACTERS', 0, '2025-10-10 16:22:24.063539');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('74589ef8-ca39-48c5-a3c2-e97563c0639b', 'LION DANCERS', 1, '2025-10-10 16:22:42.496124');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', 'GLOBE RIDERS', 2, '2025-10-10 16:22:48.518128');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('9343b728-a353-4ed8-973c-848dc567c156', 'SLACKLINERS', 3, '2025-10-10 16:22:53.995907');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('1d3c1374-3f75-4b8c-96f3-7b85961ec83c', 'WHEEL', 4, '2025-10-10 16:22:57.487923');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('6322ec0b-494c-4514-95a0-cd79cc6244a5', 'HTF - Aerialist', 5, '2025-10-10 16:23:12.883938');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('d66ce02e-26d9-4021-bbb9-2ce4e5e11486', 'HTF - Flyer', 6, '2025-10-10 16:23:21.7439');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('06ac8207-f046-4d58-ad2d-708bda594a1e', 'HTM - Acro', 7, '2025-10-10 16:23:28.250306');
INSERT INTO artist_groups (id, name, sort_order, created_at) VALUES ('9a4546bf-e4c4-47e1-ab8a-10887a2fa30e', 'HTM - Porter', 8, '2025-10-10 16:23:34.491605');

-- ================================================

-- ================================================
-- ARTISTS
-- ================================================
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('4909d035-83f7-42da-abc8-b5e93db53d8e', 'Nino', 'C', 'Nino Jr.', 'Globe Rider - Captain, King Backup', '608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', '2025-10-10 22:08:48.246625');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('377f19d4-d86f-4989-ad50-0cd14f1c5af2', 'Lucas', 'z', 'Lucas', 'Globe Rider', '608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', '2025-10-10 22:10:44.173508');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('60319a5f-f11c-40ed-a29a-1e2c39899786', 'Torres', 'z', 'Torres', 'Globe Rider', '608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', '2025-10-10 22:09:05.25331');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('0222b88b-efa1-46b2-8e7e-f589ae0abe87', 'Antonio', 'z', 'Antonio', 'Globe Rider', '608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', '2025-10-10 22:09:16.56024');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('27e81091-2460-408b-94c7-96d12b2ac47d', 'Bruno', 'z', 'Bruno', 'Globe Rider', '608f7970-65e1-4e5b-bc7d-7e88a1a1ba00', '2025-10-10 22:09:32.895157');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('cbed3795-3afb-4515-a94e-e3489fac6e21', 'Hung', 'z', 'Hung', 'Lion Back', '74589ef8-ca39-48c5-a3c2-e97563c0639b', '2025-10-10 22:06:07.953736');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('8786de6a-a666-4a74-b7cf-2f625e65a447', 'Phu', 'z', 'Phu', 'Lion Front', '74589ef8-ca39-48c5-a3c2-e97563c0639b', '2025-10-10 22:06:21.260732');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('bb83823f-5eed-4829-b9bf-8145c60722f4', 'Isabella', 'G.', 'Isabella', 'House Troupe, Pearl Girl Backup', 'd66ce02e-26d9-4021-bbb9-2ce4e5e11486', '2025-10-10 22:19:33.012658');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('4e5ba996-5589-4551-87e3-a5a8c0657d8d', 'Carolina', 'C', 'Carolina', 'PEARL GIRL', 'e358113f-312e-4df5-93ed-8ab41c646595', '2025-10-10 20:08:53.93378');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('70b4b85a-78d8-4b9a-9241-f8953f2043a4', 'Martin', 'Pons', 'Martin', 'KING', 'e358113f-312e-4df5-93ed-8ab41c646595', '2025-10-10 22:05:41.949197');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('c7f70fde-b173-49d8-96c1-22feb7866312', 'Kleber', 'z', 'Kleber', 'ANTAR', 'e358113f-312e-4df5-93ed-8ab41c646595', '2025-10-10 21:58:42.631007');
INSERT INTO artists (id, first_name, last_name, stage_name, role, artist_group_id, created_at) VALUES ('379d426c-6057-46aa-b31d-50f896f76a2a', 'Bhavik', 'z', 'Monster', 'CROWN PRINCE', 'e358113f-312e-4df5-93ed-8ab41c646595', '2025-10-10 22:05:26.694938');

-- ================================================
-- TECHNICIANS
-- ================================================
INSERT INTO technicians (id, first_name, last_name, technician_name, created_at) VALUES ('5b0ac223-bf58-49b2-b510-c9676310732a', 'Liam', 'L', 'Liam', '2025-10-10 20:24:28.950552');
INSERT INTO technicians (id, first_name, last_name, technician_name, created_at) VALUES ('e1050993-5b01-405b-9162-2aa563f69bd2', 'Paul', 'R', 'PJ', '2025-10-10 21:39:23.936615');
INSERT INTO technicians (id, first_name, last_name, technician_name, created_at) VALUES ('846746f4-e754-4095-92a0-ce27a6c741cf', 'Gabriel', 'z', 'Gabby', '2025-10-10 21:40:12.582299');
INSERT INTO technicians (id, first_name, last_name, technician_name, created_at) VALUES ('6f2319d8-e320-4b96-beaf-adc085c5eade', 'Neven', 'z', 'Neven', '2025-10-12 13:09:10.866666');
INSERT INTO technicians (id, first_name, last_name, technician_name, created_at) VALUES ('c458970f-4371-4b60-8c37-9293391c2c13', 'Himu', 'z', 'Himu', '2025-10-10 21:40:39.096148');

-- ================================================
-- SCENE DEPARTMENTS (Junction Table)
-- ================================================
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('d949726a-98ac-4c2f-8f79-443f610957fe', '79583e64-d340-47bb-a19d-22dc6c0f88be', '155b0ed0-6820-434c-bc7b-4f57a8d670a8');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('726714af-6021-4c8f-a969-c3e79a3fec99', '79583e64-d340-47bb-a19d-22dc6c0f88be', '47ced0a9-5d4f-47c9-8460-be55b6024f1f');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('2a79fe3d-1d0f-4594-91d0-39254d0e6aed', '79583e64-d340-47bb-a19d-22dc6c0f88be', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('2e891885-0b3e-4cc7-a639-0148f48425a3', '79583e64-d340-47bb-a19d-22dc6c0f88be', '74c8282d-719d-4e93-a341-a3ed7fc9c7b9');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('4eef08d0-155e-4c0d-9af5-34ce8c3d58ff', '79583e64-d340-47bb-a19d-22dc6c0f88be', '929a3866-43be-4b73-9f3a-20889e2bb487');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('e93a0ddd-fda2-43d9-bfd2-f05230987f16', '79583e64-d340-47bb-a19d-22dc6c0f88be', '95852aae-5228-404f-8d91-00f677f785f3');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('4ce1a862-7b3b-4369-b94e-8eb9cb12b470', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'b271e2ca-1e7c-4ce9-bda3-0425582f66da');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('deb8d245-0356-41d5-bcce-242c7d37ac2e', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'bd07048c-5133-4613-8990-b9be0023f08a');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('690f4e81-550d-40af-aeb6-1ae118f5220e', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'c35c5136-e744-446c-a986-2ac61eafe05a');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('db0894a7-d9d4-4684-8e9b-a65977088ed9', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'ce95b423-b2c9-4ede-b30f-c400046d993c');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('97d34c10-60b7-4fb2-b442-700c86e1570e', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'd06cc4f6-4616-41d1-b6a4-3d4672dffcb7');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('7f2cbf3d-1525-42d1-93b6-49d64d56b6eb', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'd16199e9-7c76-4b25-b76b-b8a15a926c08');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('7c6aab58-ea7d-4d55-82ca-ba3c58f690f5', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('e98daa12-97be-429d-bcf9-9b0b726f616d', '93ca94c1-217c-4def-8cde-53d561cc01e9', '155b0ed0-6820-434c-bc7b-4f57a8d670a8');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('b24d36cf-3eba-4521-b47e-b30297fea263', '93ca94c1-217c-4def-8cde-53d561cc01e9', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('ab499bc8-1887-4a98-9013-1417841225ab', '93ca94c1-217c-4def-8cde-53d561cc01e9', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('23124c6e-5ff2-4c47-b8cb-814bc89d9f36', 'da773699-42c0-4aea-89ca-596178faf7c1', '47ced0a9-5d4f-47c9-8460-be55b6024f1f');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('75617b5c-fa31-4d4e-991b-d25cfef189b2', 'da773699-42c0-4aea-89ca-596178faf7c1', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO scene_departments (id, scene_id, department_id) VALUES ('13a140c0-5ac3-4cd4-b390-b447f9c19e2c', 'da773699-42c0-4aea-89ca-596178faf7c1', 'bd07048c-5133-4613-8990-b9be0023f08a');

-- ================================================
-- ACT DEPARTMENTS (Junction Table)
-- ================================================
INSERT INTO act_departments (id, act_id, department_id) VALUES ('ca236209-f7a1-4882-9584-719b5a147f32', '2abe430c-c88f-4c11-bb7f-6e7bd01780cd', '155b0ed0-6820-434c-bc7b-4f57a8d670a8');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('49fa2d1d-8658-467c-b824-4517f89d74a2', '2abe430c-c88f-4c11-bb7f-6e7bd01780cd', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('6a37c91a-f8f8-4814-801b-60d0d279681e', '2abe430c-c88f-4c11-bb7f-6e7bd01780cd', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('9801640c-9ff5-403d-ba39-95433c43c95a', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '47ced0a9-5d4f-47c9-8460-be55b6024f1f');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('f2ad3c0c-accc-45af-9be4-ea835d8e89bf', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('f4fa091c-3a2e-4bd0-abd6-f561c193a2c6', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '929a3866-43be-4b73-9f3a-20889e2bb487');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('234abcf8-1728-4703-902a-c028d24d6429', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '95852aae-5228-404f-8d91-00f677f785f3');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('f3d0fae1-0db5-432b-b566-60dac8bc224b', 'b7fba898-f32a-4fbd-82f2-c882d2719316', 'ce95b423-b2c9-4ede-b30f-c400046d993c');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('85b420ec-d170-4f48-b7d4-36dadf84080a', 'b7fba898-f32a-4fbd-82f2-c882d2719316', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('e15110fd-57c3-4ebf-aa20-345da9fa98a6', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '155b0ed0-6820-434c-bc7b-4f57a8d670a8');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('217e7a38-9cff-44c0-951b-95d022516f76', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '47ced0a9-5d4f-47c9-8460-be55b6024f1f');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('ccc1f5f0-4622-420f-a754-310cf370436e', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '677b7ac5-f962-4ad9-a975-d490894712c8');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('623b9e51-f8a7-4e08-a68e-fa4d1ec45687', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '74c8282d-719d-4e93-a341-a3ed7fc9c7b9');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('135e5f51-75fa-441f-8346-36d7c2be8481', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '929a3866-43be-4b73-9f3a-20889e2bb487');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('7d2cb3d7-07e5-4214-a322-c6704022bb90', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '95852aae-5228-404f-8d91-00f677f785f3');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('67b91dc1-be4b-4985-8a20-261e60e2f7fc', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'b271e2ca-1e7c-4ce9-bda3-0425582f66da');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('a6720791-68d6-476d-9d21-b7448cd920d6', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'bd07048c-5133-4613-8990-b9be0023f08a');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('9b1c17b4-3e35-4554-86db-f8ccf7a1f0f0', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'c35c5136-e744-446c-a986-2ac61eafe05a');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('4088659e-57e0-4679-93c7-dff8877c33bc', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'd16199e9-7c76-4b25-b76b-b8a15a926c08');
INSERT INTO act_departments (id, act_id, department_id) VALUES ('598f5f4e-f15f-42ac-8fca-a27a670143df', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');

-- ================================================
-- SCENE ARTISTS (Junction Table)
-- ================================================
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('b2f497e6-d80d-4c12-ba8f-08402f76834a', '79583e64-d340-47bb-a19d-22dc6c0f88be', '0222b88b-efa1-46b2-8e7e-f589ae0abe87');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('6edc9b77-8514-48c9-bf9c-49ffe60341bf', '79583e64-d340-47bb-a19d-22dc6c0f88be', '27e81091-2460-408b-94c7-96d12b2ac47d');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('701fe974-af9d-4a48-b7b6-60e59860afb7', '79583e64-d340-47bb-a19d-22dc6c0f88be', '377f19d4-d86f-4989-ad50-0cd14f1c5af2');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('7d42b438-bc27-48a4-a39e-78d6a04d7fbd', '79583e64-d340-47bb-a19d-22dc6c0f88be', '379d426c-6057-46aa-b31d-50f896f76a2a');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('ebed6f19-c939-4c6c-b8e0-a0a5f9ecd930', '79583e64-d340-47bb-a19d-22dc6c0f88be', '4909d035-83f7-42da-abc8-b5e93db53d8e');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('6085b389-b244-4555-beb3-2582c8ef9bdb', '79583e64-d340-47bb-a19d-22dc6c0f88be', '4e5ba996-5589-4551-87e3-a5a8c0657d8d');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('cbd82779-b40b-493a-a2b5-30ad248fcac8', '79583e64-d340-47bb-a19d-22dc6c0f88be', '60319a5f-f11c-40ed-a29a-1e2c39899786');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('21586e3b-53e4-4b8a-be6a-946d762c0615', '79583e64-d340-47bb-a19d-22dc6c0f88be', '70b4b85a-78d8-4b9a-9241-f8953f2043a4');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('06b76cfa-510f-451b-94c8-b44bf7314773', '79583e64-d340-47bb-a19d-22dc6c0f88be', '8786de6a-a666-4a74-b7cf-2f625e65a447');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('16c5efdb-8e57-475a-857c-460401fdf3a8', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'bb83823f-5eed-4829-b9bf-8145c60722f4');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('a3eef1b4-dffd-4ea1-86df-ace485edfbd0', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'c7f70fde-b173-49d8-96c1-22feb7866312');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('4aa121c4-cb0f-41eb-bb83-0891f37c225b', '79583e64-d340-47bb-a19d-22dc6c0f88be', 'cbed3795-3afb-4515-a94e-e3489fac6e21');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('77168962-18b3-4de3-8fa7-ab2db1d0f6d7', '93ca94c1-217c-4def-8cde-53d561cc01e9', '4e5ba996-5589-4551-87e3-a5a8c0657d8d');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('0968ccee-c9c4-44b2-b45b-a439db915407', 'da773699-42c0-4aea-89ca-596178faf7c1', '4e5ba996-5589-4551-87e3-a5a8c0657d8d');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('2d37bbde-e18e-4b27-aae8-2fe4f6705970', 'da773699-42c0-4aea-89ca-596178faf7c1', '70b4b85a-78d8-4b9a-9241-f8953f2043a4');
INSERT INTO scene_artists (id, scene_id, artist_id) VALUES ('f54aecd7-8f57-4c2c-91d3-9ccbdfbcd6fe', 'da773699-42c0-4aea-89ca-596178faf7c1', 'c7f70fde-b173-49d8-96c1-22feb7866312');

-- ================================================
-- ACT ARTISTS (Junction Table)
-- ================================================
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('abe2b752-4bfd-4092-9a6a-01ddea487fd3', '2abe430c-c88f-4c11-bb7f-6e7bd01780cd', '4e5ba996-5589-4551-87e3-a5a8c0657d8d');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('097fdd43-3a62-4cf0-aa96-fe8515f7e6d2', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '0222b88b-efa1-46b2-8e7e-f589ae0abe87');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('6277c587-3f9d-4502-a9cc-c786b36e7570', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '27e81091-2460-408b-94c7-96d12b2ac47d');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('5fc8eb0f-a4fd-43aa-b2cc-8e038b0673e8', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '377f19d4-d86f-4989-ad50-0cd14f1c5af2');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('a537dac3-ba06-4bb3-bc30-33c61dcabbac', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '4909d035-83f7-42da-abc8-b5e93db53d8e');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('461a0b93-3d08-4667-9f13-4327a4ec2d4c', 'b7fba898-f32a-4fbd-82f2-c882d2719316', '60319a5f-f11c-40ed-a29a-1e2c39899786');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('3f9ac0f3-6f79-4cac-bb91-2a18b7f145a9', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '379d426c-6057-46aa-b31d-50f896f76a2a');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('27b44d3c-82cc-49b6-8feb-12efc3c13a19', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '4e5ba996-5589-4551-87e3-a5a8c0657d8d');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('4167eba6-5e16-4f2f-93fd-68e6def85070', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', '70b4b85a-78d8-4b9a-9241-f8953f2043a4');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('e28fed02-402f-4cbc-a95e-4785b4f624d6', 'bd1efdd9-a678-4ffa-8d2a-4207c8484abb', 'c7f70fde-b173-49d8-96c1-22feb7866312');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('1dea34da-0aa2-4da2-80ff-98cba938b0d1', 'd2ac16b8-ed63-4187-ae7a-e66707c5fa1e', '379d426c-6057-46aa-b31d-50f896f76a2a');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('424337b5-b263-4550-a31d-1333d2ff75f5', 'd2ac16b8-ed63-4187-ae7a-e66707c5fa1e', '70b4b85a-78d8-4b9a-9241-f8953f2043a4');
INSERT INTO act_artists (id, act_id, artist_id) VALUES ('7635338d-7700-4f7d-9d0e-3be467f2a926', 'd2ac16b8-ed63-4187-ae7a-e66707c5fa1e', 'c7f70fde-b173-49d8-96c1-22feb7866312');

-- ================================================
-- TECHNICIAN DEPARTMENTS (Junction Table)
-- ================================================
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('ad180238-dda9-4850-9cdb-55489010b8ec', '5b0ac223-bf58-49b2-b510-c9676310732a', 'd3aa7d41-e7d9-4891-b209-81bfb037b184');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('74041c19-8462-438c-ad89-dddbac019c93', '6f2319d8-e320-4b96-beaf-adc085c5eade', '155b0ed0-6820-434c-bc7b-4f57a8d670a8');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('c41358c7-8485-4d55-87f0-701f32050e3d', '6f2319d8-e320-4b96-beaf-adc085c5eade', 'ce95b423-b2c9-4ede-b30f-c400046d993c');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('34210ea8-a6b3-4712-88c7-5bfd70946f88', '6f2319d8-e320-4b96-beaf-adc085c5eade', 'd06cc4f6-4616-41d1-b6a4-3d4672dffcb7');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('63b57f1e-5c3d-4b44-9f8a-7135a4d0c799', '846746f4-e754-4095-92a0-ce27a6c741cf', '74c8282d-719d-4e93-a341-a3ed7fc9c7b9');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('65bfd877-9378-40e1-97d3-cb63b61d5e55', 'c458970f-4371-4b60-8c37-9293391c2c13', '929a3866-43be-4b73-9f3a-20889e2bb487');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('2e899691-e05d-412e-90bb-877fc6e79983', 'e1050993-5b01-405b-9162-2aa563f69bd2', '47ced0a9-5d4f-47c9-8460-be55b6024f1f');
INSERT INTO technician_departments (id, technician_id, department_id) VALUES ('03605879-3664-4b83-8574-62aad03971dc', 'e1050993-5b01-405b-9162-2aa563f69bd2', 'bd07048c-5133-4613-8990-b9be0023f08a');

-- ================================================
-- IMPORT COMPLETE!
-- ================================================
-- All settings have been imported successfully.
-- You can now create reports and trainings in production.
-- Note: Report template excluded - configure in Settings if needed
