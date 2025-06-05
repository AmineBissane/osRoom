package com.example.activities.repository;

import com.example.activities.models.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByClassroomsIdsIn(List<Long> classroomsIds);

}
