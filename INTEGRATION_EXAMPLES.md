# Example Integration Code for Dashboard Pages

## 1. Customer Dashboard - List Available Alims

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';

export default function AlimsList() {
  const { request } = useApi();
  const [alims, setAlims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ city: '', fiqh: '', sort: 'distance' });

  useEffect(() => {
    const fetchAlims = async () => {
      try {
        const params = new URLSearchParams();
        if (filter.city) params.append('city', filter.city);
        if (filter.fiqh) params.append('fiqh', filter.fiqh);
        params.append('sort', filter.sort);

        const data = await request(`/api/alims?${params}`);
        setAlims(data.alims || []);
      } finally {
        setLoading(false);
      }
    };

    fetchAlims();
  }, [filter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="City"
          onChange={(e) => setFilter(p => ({ ...p, city: e.target.value }))}
          className="border px-4 py-2 rounded"
        />
        <select
          value={filter.fiqh}
          onChange={(e) => setFilter(p => ({ ...p, fiqh: e.target.value }))}
          className="border px-4 py-2 rounded"
        >
          <option value="">All Fiqh</option>
          <option value="Hanafi">Hanafi</option>
          <option value="Shafi">Shafi</option>
          <option value="Maliki">Maliki</option>
          <option value="Hanbali">Hanbali</option>
        </select>
      </div>

      {/* Alims List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {alims.map((alim) => (
            <div key={alim.id} className="border rounded-lg p-4 hover:shadow-lg">
              <h3 className="font-bold text-lg">{alim.name}</h3>
              <p className="text-sm text-gray-600">Rating: {alim.rating} ⭐</p>
              <p className="text-sm">Fiqh: {alim.fiqh}</p>
              <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 2. Customer Dashboard - Create Appointment

```tsx
'use client';

import { useState } from 'react';
import { useApi } from '@/lib/useApi';
import { getCurrentUser } from '@/lib/auth';

export default function BookAppointment() {
  const user = getCurrentUser();
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    alimId: 0,
    serviceId: 0,
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user?.id,
          ...formData
        })
      });
      alert('Appointment booked successfully!');
      // Reset form
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="number"
        placeholder="Alim ID"
        onChange={(e) => setFormData(p => ({ ...p, alimId: parseInt(e.target.value) }))}
        required
      />
      <input
        type="number"
        placeholder="Service ID"
        onChange={(e) => setFormData(p => ({ ...p, serviceId: parseInt(e.target.value) }))}
        required
      />
      <input
        type="date"
        onChange={(e) => setFormData(p => ({ ...p, appointmentDate: e.target.value }))}
        required
      />
      <input
        type="time"
        onChange={(e) => setFormData(p => ({ ...p, appointmentTime: e.target.value }))}
        required
      />
      <textarea
        placeholder="Notes (optional)"
        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  );
}
```

## 3. Alim Dashboard - Update Profile

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/useApi';
import { getCurrentUser } from '@/lib/auth';

export default function UpdateProfile() {
  const user = getCurrentUser();
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    experience: '',
    languages: '',
    bio: '',
    availableTime: '',
    area: '',
    city: '',
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    // Fetch current profile
    if (user?.id) {
      const fetchProfile = async () => {
        try {
          const data = await request(`/api/alims/${user.id}`);
          setFormData({
            experience: data.experience || '',
            languages: data.languages || '',
            bio: data.bio || '',
            availableTime: data.availableTime || '',
            area: data.area || '',
            city: data.city || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
          });
        } catch (err) {
          console.error('Failed to fetch profile');
        }
      };
      fetchProfile();
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request(`/api/alims/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        type="text"
        placeholder="Experience"
        value={formData.experience}
        onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />
      <input
        type="text"
        placeholder="Languages"
        value={formData.languages}
        onChange={(e) => setFormData(p => ({ ...p, languages: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />
      <textarea
        placeholder="Bio"
        value={formData.bio}
        onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />
      <input
        type="text"
        placeholder="Area"
        value={formData.area}
        onChange={(e) => setFormData(p => ({ ...p, area: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

## 4. Alim Dashboard - Set Availability

```tsx
'use client';

import { useState } from 'react';
import { useApi } from '@/lib/useApi';
import { getCurrentUser } from '@/lib/auth';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SetAvailability() {
  const user = getCurrentUser();
  const { request, loading } = useApi();
  const [availability, setAvailability] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00'
  });

  const handleAdd = async () => {
    try {
      await request('/api/alim-availability', {
        method: 'POST',
        body: JSON.stringify({
          alimId: user?.id,
          ...availability
        })
      });
      alert('Availability slot added!');
    } catch (err) {
      alert('Failed to add availability');
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <select
        value={availability.dayOfWeek}
        onChange={(e) => setAvailability(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
        className="w-full border px-4 py-2 rounded"
      >
        {DAYS.map((day, idx) => (
          <option key={idx} value={idx}>{day}</option>
        ))}
      </select>

      <input
        type="time"
        value={availability.startTime}
        onChange={(e) => setAvailability(p => ({ ...p, startTime: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />

      <input
        type="time"
        value={availability.endTime}
        onChange={(e) => setAvailability(p => ({ ...p, endTime: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
      />

      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Adding...' : 'Add Availability Slot'}
      </button>
    </div>
  );
}
```

## 5. Add Review to Appointment

```tsx
'use client';

import { useState } from 'react';
import { useApi } from '@/lib/useApi';
import { getCurrentUser } from '@/lib/auth';

export default function AddReview({ appointmentId, alimId }: { appointmentId: number; alimId: number }) {
  const user = getCurrentUser();
  const { request, loading } = useApi();
  const [review, setReview] = useState({
    rating: 5,
    reviewText: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          alimId,
          customerId: user?.id,
          appointmentId,
          ...review
        })
      });
      alert('Review submitted successfully!');
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label>Rating: {review.rating}</label>
        <input
          type="range"
          min="1"
          max="5"
          value={review.rating}
          onChange={(e) => setReview(p => ({ ...p, rating: parseInt(e.target.value) }))}
          className="w-full"
        />
      </div>

      <textarea
        placeholder="Write your review"
        value={review.reviewText}
        onChange={(e) => setReview(p => ({ ...p, reviewText: e.target.value }))}
        className="w-full border px-4 py-2 rounded"
        rows={4}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
```

---

## How to Use These Examples

1. Copy the code snippets into your respective page components
2. Update the file paths based on your project structure
3. Adjust styling to match your design system
4. Add proper error handling and loading states
5. Test with your local SQL Server database

All API endpoints are fully functional and ready to use!
