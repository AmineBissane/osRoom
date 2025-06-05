package com.example.classrooms.Repository;

import com.example.classrooms.models.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<Classroom, Long> {
    @Query("SELECT c FROM Classroom c WHERE :classCategory MEMBER OF c.classcategories")
    List<Classroom> findByClasscategories(@Param("classCategory") String classCategory);
}
