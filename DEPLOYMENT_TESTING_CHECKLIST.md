# ✅ DEPLOYMENT & TESTING CHECKLIST - MULTI-PROVINCE DELIVERY

## Phase 1: Pre-Deployment Configuration

### Environment Setup

-   [ ] **Backend Environment Variables**

    ```
    GOOGLE_MAPS_API_KEY=xxx
    DATABASE_URL=xxx
    JWT_SECRET=xxx
    ```

    Location: `.env` in `Server/` folder

-   [ ] **Frontend Environment Variables**

    ```
    VITE_GOOGLE_MAPS_API_KEY=xxx
    VITE_API_URL=http://localhost:5000
    ```

    Location: `.env` in `Client/Book4U/` folder

-   [ ] **Database Initialization**
    ```bash
    # Create indexes
    npm run seed:indexes
    # Or manually:
    db.DeliveryStage.createIndex({ mainOrderId: 1, stageNumber: 1 })
    db.DeliveryStage.createIndex({ mainOrderId: 1, status: 1 })
    db.DeliveryStage.createIndex({ orderDetailId: 1 })
    db.DeliveryStage.createIndex({ assignedShipperId: 1, status: 1 })
    db.DeliveryStage.createIndex({ 'toLocation.province': 1, status: 1 })
    ```

### Data Seeding

-   [ ] **Create Test Shippers** (with coverage areas)

    ```bash
    POST /api/shipper-coverage/create
    {
      "shipperId": "shipper_tphcm_001",
      "shipperType": "local",
      "coverageAreas": [
        { "province": "TP.HCM", "districts": ["Q1", "Q2", "Q3"] }
      ]
    }

    POST /api/shipper-coverage/create
    {
      "shipperId": "shipper_hn_001",
      "shipperType": "local",
      "coverageAreas": [
        { "province": "Hà Nội", "districts": ["Ba Đình", "Hoàn Kiếm"] }
      ]
    }
    ```

-   [ ] **Create Test Orders**
    -   Create order with TPHCM warehouse and TPHCM customer (nội tỉnh)
    -   Create order with TPHCM warehouse and HN customer (liên tỉnh)
    -   Create order with mixed multi-seller (some nội tỉnh, some liên tỉnh)

---

## Phase 2: Unit Testing

### Backend Tests

#### DeliveryStage Model

-   [ ] Test stage creation with all required fields
-   [ ] Test stage.canTransferToNextStage() method
-   [ ] Test stage.canDeliver() method
-   [ ] Test location history push

#### multiStageDeliveryController Tests

-   [ ] **createDeliveryStages()**

    -   [ ] Nội tỉnh detection (same province) → 1 stage created
    -   [ ] Liên tỉnh detection (different province) → 3 stages created
    -   [ ] Stage numbers and isLastStage flags correct
    -   [ ] OrderDetail.currentStageIndex set to 0
    -   [ ] Invalid orderDetailId returns 404

-   [ ] **getDeliveryStages()**

    -   [ ] Returns all stages for orderDetailId
    -   [ ] Returns empty array if no stages
    -   [ ] Correctly populates orderDetailId

-   [ ] **acceptDeliveryStage()**

    -   [ ] Stage status changes pending → accepted
    -   [ ] acceptedAt timestamp set
    -   [ ] assignedShipperId set to shipper
    -   [ ] Can't accept if shipper not in coverage area

-   [ ] **pickupPackage()**

    -   [ ] Stage status changes accepted → picked_up
    -   [ ] pickedUpAt timestamp set
    -   [ ] currentLocation set correctly
    -   [ ] locationHistory entry added

-   [ ] **updateShipperLocation()**

    -   [ ] currentLocation updated
    -   [ ] Status can change to in_transit
    -   [ ] locationHistory entry added each call
    -   [ ] Works without address (optional)

-   [ ] **completeDeliveryStage()**

    -   [ ] Stage status changes → delivered
    -   [ ] deliveredAt timestamp set
    -   [ ] isLastStage=true triggers:
        -   [ ] OrderDetail.status = delivered
        -   [ ] MainOrder.status = completed (if all items delivered)
    -   [ ] isLastStage=false triggers:
        -   [ ] Next stage status = pending
        -   [ ] OrderDetail.currentStageIndex incremented

-   [ ] **getShipperOrders()**

    -   [ ] Returns only pending stages in shipper's coverage area
    -   [ ] Filters by shipper.coverageAreas.province
    -   [ ] Returns correct count
    -   [ ] No orders shown if shipper has no coverage

-   [ ] **trackOrderRealtime()**
    -   [ ] Returns current stage details
    -   [ ] Returns all stages timeline
    -   [ ] Returns location history
    -   [ ] Works for any orderDetailId (public endpoint)

### Frontend Tests

#### Components

-   [ ] **DeliveryMapTracker**

    -   [ ] Google Maps API loads correctly
    -   [ ] Markers displayed for all locations
    -   [ ] Route lines drawn correctly
    -   [ ] Color coding matches status
    -   [ ] Polling updates every 30 seconds
    -   [ ] Handles missing coordinates gracefully

-   [ ] **DeliveryStageTracker**

    -   [ ] Displays all stages in timeline
    -   [ ] Current stage highlighted
    -   [ ] Stage status colors correct
    -   [ ] Timestamps displayed (if available)
    -   [ ] Province names shown correctly

-   [ ] **ShipperDeliveryManagement**

    -   [ ] Displays pending orders for shipper
    -   [ ] Accept button works
    -   [ ] Order details expand/collapse
    -   [ ] Auto-refresh works (60 second interval)

-   [ ] **ShipperDashboard**
    -   [ ] View mode toggle (list ↔ map)
    -   [ ] GPS tracking enabled
    -   [ ] Location updates every 30 seconds
    -   [ ] Loading states work correctly
    -   [ ] Error messages displayed

#### API Calls

-   [ ] **multiDeliveryApi.createDeliveryStages()**

    -   [ ] POST request sent correctly
    -   [ ] Response parsed properly
    -   [ ] Error handling works

-   [ ] **multiDeliveryApi.getShipperOrders()**

    -   [ ] GET request sent correctly
    -   [ ] Filters applied
    -   [ ] Response populated in UI

-   [ ] **multiDeliveryApi.acceptDeliveryStage()**

    -   [ ] PUT request sent
    -   [ ] Order list refreshed after acceptance

-   [ ] **multiDeliveryApi.updateShipperLocation()**

    -   [ ] PUT request sent with correct data
    -   [ ] Silent failures handled (no errors in production)

-   [ ] **multiDeliveryApi.trackOrderRealtime()**
    -   [ ] GET request sent
    -   [ ] Public access works (no auth)
    -   [ ] Real-time updates work

---

## Phase 3: Integration Testing

### Nội Tỉnh Delivery Flow (End-to-End)

```
[ ] 1. Seller creates order
      - Warehouse: TP.HCM
      - Customer: TP.HCM

[ ] 2. Seller confirms order

[ ] 3. Seller ships order
      - POST /api/multi-delivery/stages/create
      - Verify: 1 stage created
      - Verify: OrderDetail.isInterProvincial = false

[ ] 4. Shipper TPHCM checks dashboard
      - GET /api/multi-delivery/shipper/orders
      - Verify: Order appears in list

[ ] 5. Shipper TPHCM accepts order
      - PUT /api/multi-delivery/stages/:id/accept
      - Verify: status = accepted

[ ] 6. Shipper TPHCM picks up
      - PUT /api/multi-delivery/stages/:id/pickup
      - Verify: status = picked_up, pickedUpAt set

[ ] 7. Shipper TPHCM updates location (realtime)
      - PUT /api/multi-delivery/stages/:id/location (multiple times)
      - Verify: currentLocation updated
      - Verify: locationHistory array grows

[ ] 8. Customer views tracking
      - GET /api/multi-delivery/track/:id
      - Verify: currentLocation visible
      - Verify: Map displays shipper position

[ ] 9. Shipper TPHCM completes delivery
      - PUT /api/multi-delivery/stages/:id/complete
      - Verify: status = delivered
      - Verify: isLastStage = true

[ ] 10. Verify final state
       - GET /api/multi-delivery/stages/:id
       - Verify: OrderDetail.status = delivered
       - Verify: MainOrder.status = completed
```

### Liên Tỉnh Delivery Flow (End-to-End)

```
[ ] 1. Seller creates order
      - Warehouse: TP.HCM
      - Customer: Hà Nội

[ ] 2. Seller confirms order

[ ] 3. Seller ships order
      - POST /api/multi-delivery/stages/create
      - Verify: 3 stages created
      - Verify: OrderDetail.isInterProvincial = true
      - Verify: OrderDetail.currentStageIndex = 0

[ ] 4. Shipper TPHCM checks dashboard
      - GET /api/multi-delivery/shipper/orders
      - Verify: Stage 1 appears (TPHCM → Hub TPHCM)
      - Verify: Stage 3 does NOT appear

[ ] 5. Shipper TPHCM completes Stage 1
      - accept → pickup → in_transit → complete
      - Verify: Stage 1 status = delivered, isLastStage = false

[ ] 6. Verify Stage 2 activated
      - GET /api/multi-delivery/stages/:id
      - Verify: OrderDetail.currentStageIndex = 1
      - Verify: Stage 2.status = pending

[ ] 7. [System] Complete Stage 2 (auto or manual)
      - PUT /api/multi-delivery/stages/stage2/complete
      - Verify: Stage 2 delivered
      - Verify: OrderDetail.currentStageIndex = 2

[ ] 8. Shipper HN checks dashboard
      - GET /api/multi-delivery/shipper/orders
      - Verify: Stage 3 appears (Hub HN → Customer)
      - Verify: Stage 1, 2 do NOT appear

[ ] 9. Shipper HN completes Stage 3
      - accept → pickup → in_transit → complete
      - Verify: Stage 3 status = delivered, isLastStage = true

[ ] 10. Verify final state
       - GET /api/multi-delivery/stages/:id
       - Verify: OrderDetail.status = delivered
       - Verify: MainOrder.status = completed
       - Verify: All stages marked delivered
```

### Shipper Coverage Filtering

```
[ ] Shipper A (TPHCM coverage) views orders
    - Should see: TPHCM nội tỉnh, Stage 1 of TPHCM→HN
    - Should NOT see: HN nội tỉnh, Stage 3 of TPHCM→HN

[ ] Shipper B (HN coverage) views orders
    - Should see: HN nội tỉnh, Stage 3 of TPHCM→HN
    - Should NOT see: TPHCM nội tỉnh, Stage 1 of TPHCM→HN
```

### Real-Time Location Tracking

```
[ ] GPS updates received every 30 seconds
    - Call updateShipperLocation() multiple times
    - Verify: locationHistory grows
    - Verify: currentLocation updated
    - Verify: Timestamps progress chronologically

[ ] Customer sees live tracking
    - trackOrderRealtime() returns updated location
    - Map marker moves in real-time
    - Location history trail visible
```

---

## Phase 4: Load Testing

### Simulate Multiple Concurrent Deliveries

```bash
# Generate 100 orders
for i in {1..100}; do
  POST /api/multi-delivery/stages/create \
    { "orderDetailId": "order_$i" }
done

# Shipper receives location updates
for i in {1..100}; do
  PUT /api/multi-delivery/stages/stage_$i/location \
    { lat, lng, address }
done

# Customer tracking queries
for i in {1..100}; do
  GET /api/multi-delivery/track/order_$i
done
```

-   [ ] No timeout errors
-   [ ] Response times < 1 second
-   [ ] Database indexes optimize queries
-   [ ] Memory usage stable

---

## Phase 5: Browser Compatibility Testing

-   [ ] Chrome (latest)
-   [ ] Firefox (latest)
-   [ ] Safari (latest)
-   [ ] Edge (latest)
-   [ ] Mobile Chrome
-   [ ] Mobile Safari

**Test:**

-   [ ] Maps load correctly
-   [ ] GPS permission request works
-   [ ] Location updates work
-   [ ] No console errors

---

## Phase 6: Production Deployment

### Pre-Deployment Checklist

-   [ ] Code reviewed and approved
-   [ ] All tests passing (unit, integration, e2e)
-   [ ] Environment variables configured
-   [ ] Database backups taken
-   [ ] Rollback plan documented

### Deployment Steps

```bash
# 1. Backend
cd Server
npm install
npm run build
npm run start

# 2. Frontend
cd Client/Book4U
npm install
npm run build
# Deploy dist/ to hosting

# 3. Verify
curl http://production-url/api/multi-delivery/shipper/orders
```

-   [ ] Health check endpoint works
-   [ ] API responses fast (< 1s)
-   [ ] Maps load correctly
-   [ ] No JavaScript errors

### Post-Deployment Testing

-   [ ] Create test order and ship it
-   [ ] Shipper receives it in dashboard
-   [ ] Customer can track it
-   [ ] Shipper can complete delivery
-   [ ] Final status correct

### Monitoring

-   [ ] Server logs monitored
-   [ ] Database performance monitored
-   [ ] API error rates tracked
-   [ ] Response time SLA (< 1 second)
-   [ ] GPS update latency measured
-   [ ] Google Maps API quota monitored

---

## Phase 7: User Acceptance Testing (UAT)

### Seller Testing

-   [ ] Ship nội tỉnh order
-   [ ] Ship liên tỉnh order
-   [ ] View order status
-   [ ] Receive notifications

### Shipper Testing

-   [ ] View pending orders in dashboard
-   [ ] See correct orders (province filtering)
-   [ ] Accept order
-   [ ] Use GPS tracking
-   [ ] Complete delivery
-   [ ] View delivery history

### Customer Testing

-   [ ] View tracking in real-time
-   [ ] See order location on map
-   [ ] See all stages for liên tỉnh
-   [ ] Receive delivery notification
-   [ ] Rate delivery after completion

### Admin Testing

-   [ ] Setup shipper coverage areas
-   [ ] View all deliveries (reporting)
-   [ ] View performance metrics
-   [ ] Manage shipper capacity

---

## Phase 8: Monitoring & Maintenance

### Daily Checks

-   [ ] Check error logs for failures
-   [ ] Verify GPS updates are flowing
-   [ ] Monitor database size
-   [ ] Check Google Maps API quota

### Weekly Checks

-   [ ] Review delivery success rate
-   [ ] Check average delivery time
-   [ ] Monitor system performance metrics
-   [ ] Review user feedback

### Monthly Optimization

-   [ ] Analyze delivery patterns
-   [ ] Optimize shipper assignments
-   [ ] Update coverage areas if needed
-   [ ] Performance tuning based on metrics

---

## Rollback Plan

If issues occur:

```bash
# 1. Stop affected services
docker-compose stop api

# 2. Revert database (from backup)
mongorestore --db book4u --archive=backup.archive

# 3. Revert code (to previous commit)
git revert <commit-hash>
npm start

# 4. Verify services
curl http://localhost:5000/health

# 5. Notify users
Send notification: "Service restored"
```

---

## Sign-Off

-   [ ] Backend Developer: ******\_\_****** Date: **\_\_\_**
-   [ ] Frontend Developer: ******\_****** Date: **\_\_\_**
-   [ ] QA Lead: **********\_\_********** Date: **\_\_\_**
-   [ ] Product Manager: ******\_\_****** Date: **\_\_\_**
-   [ ] DevOps/System Admin: ****\_\_**** Date: **\_\_\_**

---

## Notes

Use this space for any additional notes, issues found, or custom configurations:

```
[Write notes here]
```

---

**Last Updated:** December 16, 2025
**Version:** 1.0
