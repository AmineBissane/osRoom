package com.example.activitiesresponses.Repository;

import com.example.activitiesresponses.entities.ActivitiesResponses;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivitiesResponsesRepository extends JpaRepository<ActivitiesResponses, Long> {
        List<ActivitiesResponses> findByActivityId(Long activityId);
        
        /**
         * Find all activity responses by student ID
         * @param studentId The ID of the student
         * @return List of activity responses
         */
        List<ActivitiesResponses> findByStudentId(Long studentId);
        
        /**
         * Find all activity responses for a specific student in a specific activity
         * @param activityId The ID of the activity
         * @param studentId The ID of the student
         * @return List of activity responses (typically should be just one)
         */
        List<ActivitiesResponses> findByActivityIdAndStudentId(Long activityId, Long studentId);
        
        /**
         * Find all activity responses graded by a specific user UUID
         * @param gradedByUuid The UUID of the grader
         * @return List of activity responses
         */
        List<ActivitiesResponses> findByGradedByUuid(String gradedByUuid);
}
