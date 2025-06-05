package com.example.classrooms.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * Utility class for date and time operations
 */
public class DateTimeUtils {
    
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_DATE;
    private static final DateTimeFormatter UI_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    /**
     * Converts a string in ISO format to LocalDateTime
     * @param dateTimeStr Date time string in ISO format
     * @return LocalDateTime object
     */
    public static LocalDateTime parseIsoDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, ISO_FORMATTER);
    }
    
    /**
     * Formats a LocalDateTime to ISO format
     * @param dateTime LocalDateTime to format
     * @return String in ISO format
     */
    public static String formatIsoDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(ISO_FORMATTER);
    }
    
    /**
     * Converts a Date to LocalDateTime
     * @param date Date to convert
     * @return LocalDateTime
     */
    public static LocalDateTime dateToLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
    
    /**
     * Converts a LocalDateTime to Date
     * @param dateTime LocalDateTime to convert
     * @return Date
     */
    public static Date localDateTimeToDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
    
    /**
     * Formats a LocalDateTime to a user-friendly format
     * @param dateTime LocalDateTime to format
     * @return String in user-friendly format
     */
    public static String formatUserFriendly(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(UI_FORMATTER);
    }
    
    /**
     * Converts a LocalDate to LocalDateTime (start of day)
     * @param date LocalDate to convert
     * @return LocalDateTime at start of day
     */
    public static LocalDateTime localDateToStartOfDay(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atStartOfDay();
    }
    
    /**
     * Converts a LocalDate to LocalDateTime (end of day)
     * @param date LocalDate to convert
     * @return LocalDateTime at end of day
     */
    public static LocalDateTime localDateToEndOfDay(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atTime(23, 59, 59, 999999999);
    }
} 