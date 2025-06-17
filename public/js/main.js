// Wait for the document to be ready
$(document).ready(function() {
  // Initialize tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Service booking form handling
  if ($('#bookingForm').length) {
    // When manicurist is selected, enable date picker
    $('#manicurist').on('change', function() {
      if ($(this).val()) {
        $('#dateContainer').removeClass('d-none');
        $('#appointmentDate').prop('disabled', false);
      } else {
        $('#dateContainer').addClass('d-none');
        $('#appointmentDate').prop('disabled', true);
        $('#timeContainer').addClass('d-none');
        $('#appointmentTime').prop('disabled', true);
      }
    });

    // When date is selected, fetch available time slots
    $('#appointmentDate').on('change', function() {
      const date = $(this).val();
      const manicuristId = $('#manicurist').val();
      
      if (date && manicuristId) {
        // Show loading spinner
        $('#timeContainer').removeClass('d-none');
        $('#appointmentTime').html('<option value="">Loading time slots...</option>');
        $('#appointmentTime').prop('disabled', true);
        
        // Fetch available time slots from server
        $.ajax({
          url: '/appointments/available-times',
          data: {
            manicuristId: manicuristId,
            date: date
          },
          success: function(response) {
            if (response.success && response.timeSlots.length > 0) {
              // Populate time slots dropdown
              let options = '<option value="">Select Time</option>';
              response.timeSlots.forEach(function(slot) {
                // Use the formatted time from backend and the ISO datetime for value
                options += `<option value="${slot.datetime}">${slot.time}</option>`;
              });
              $('#appointmentTime').html(options);
              $('#appointmentTime').prop('disabled', false);
            } else {
              // No time slots available
              $('#appointmentTime').html('<option value="">No available time slots</option>');
              $('#appointmentTime').prop('disabled', true);
            }
          },
          error: function() {
            // Error handling
            $('#appointmentTime').html('<option value="">Error loading time slots</option>');
            $('#appointmentTime').prop('disabled', true);
          }
        });
      } else {
        $('#timeContainer').addClass('d-none');
        $('#appointmentTime').prop('disabled', true);
      }
    });
    
    // Form validation
    $('#bookingForm').on('submit', function(e) {
      let isValid = true;
      
      // Check if manicurist is selected
      if (!$('#manicurist').val()) {
        $('#manicuristFeedback').text('Please select a manicurist');
        isValid = false;
      } else {
        $('#manicuristFeedback').text('');
      }
      
      // Check if service is selected
      if (!$('#service').val()) {
        $('#serviceFeedback').text('Please select a service');
        isValid = false;
      } else {
        $('#serviceFeedback').text('');
      }
      
      // Check if time is selected
      if (!$('#appointmentTime').val()) {
        $('#timeFeedback').text('Please select an appointment time');
        isValid = false;
      } else {
        $('#timeFeedback').text('');
      }
      
      if (!isValid) {
        e.preventDefault();
      }
    });
  }
  
  // Delete confirmation
  $('.delete-btn').on('click', function(e) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      e.preventDefault();
    }
  });
  
  // Cancel appointment confirmation
  $('.cancel-appointment-btn').on('click', function(e) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      e.preventDefault();
    }
  });
});
