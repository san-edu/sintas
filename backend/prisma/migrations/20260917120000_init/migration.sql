-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `birth_date` DATE NULL,
    `name` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `education_levels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    UNIQUE INDEX `education_levels_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `teacher_profiles` (
    `user_id` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_profiles` (
    `user_id` INTEGER NOT NULL,
    `student_number` VARCHAR(50) NOT NULL,
    `education_level_id` INTEGER NOT NULL,
    UNIQUE INDEX `student_profiles_student_number_key`(`student_number`),
    INDEX `student_profiles_education_level_id_idx`(`education_level_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `education_level_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    INDEX `classes_education_level_id_idx`(`education_level_id`),
    UNIQUE INDEX `classes_education_level_id_name_key`(`education_level_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    UNIQUE INDEX `subjects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `class_students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    INDEX `class_students_student_id_is_active_idx`(`student_id`, `is_active`),
    INDEX `class_students_class_id_is_active_idx`(`class_id`, `is_active`),
    UNIQUE INDEX `class_students_class_id_student_id_is_active_key`(`class_id`, `student_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `teacher_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacher_id` INTEGER NOT NULL,
    `class_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    INDEX `teacher_assignments_teacher_id_is_active_idx`(`teacher_id`, `is_active`),
    INDEX `teacher_assignments_class_id_is_active_idx`(`class_id`, `is_active`),
    INDEX `teacher_assignments_subject_id_is_active_idx`(`subject_id`, `is_active`),
    UNIQUE INDEX `teacher_assignments_teacher_id_class_id_subject_id_is_active_key`(`teacher_id`, `class_id`, `subject_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attendance_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignment_id` INTEGER NOT NULL,
    `class_id` INTEGER NOT NULL,
    `session_date` DATE NOT NULL,
    `start_at` TIMESTAMP(6) NOT NULL,
    `end_at` TIMESTAMP(6) NOT NULL,
    `qr_payload` VARCHAR(255) NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    UNIQUE INDEX `attendance_sessions_qr_payload_key`(`qr_payload`),
    INDEX `attendance_sessions_assignment_id_start_at_end_at_idx`(`assignment_id`, `start_at`, `end_at`),
    INDEX `attendance_sessions_class_id_session_date_idx`(`class_id`, `session_date`),
    UNIQUE INDEX `attendance_sessions_assignment_id_session_date_start_at_end__key`(`assignment_id`, `session_date`, `start_at`, `end_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attendance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `scanned_at` TIMESTAMP(6) NOT NULL,
    `status` ENUM('HADIR', 'TERLAMBAT', 'TIDAK_HADIR') NOT NULL,
    `late_minutes` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    INDEX `attendance_records_student_id_scanned_at_idx`(`student_id`, `scanned_at`),
    INDEX `attendance_records_session_id_status_idx`(`session_id`, `status`),
    UNIQUE INDEX `attendance_records_session_id_student_id_key`(`session_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `content` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `display_start_at` TIMESTAMP(6) NULL,
    `display_end_at` TIMESTAMP(6) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    INDEX `banners_is_active_display_start_at_display_end_at_idx`(`is_active`, `display_start_at`, `display_end_at`),
    INDEX `banners_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_education_level_id_fkey` FOREIGN KEY (`education_level_id`) REFERENCES `education_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `classes` ADD CONSTRAINT `classes_education_level_id_fkey` FOREIGN KEY (`education_level_id`) REFERENCES `education_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `teacher_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `banners` ADD CONSTRAINT `banners_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
