package com.tp.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tp.backend.entities.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
}
