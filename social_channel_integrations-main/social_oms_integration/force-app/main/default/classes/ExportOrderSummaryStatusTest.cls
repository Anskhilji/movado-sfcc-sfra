/* 06/23/2023 Code Coverage: 94% */
@IsTest(SeeAllData=true) //Required due to the ConnectApi call, following the documentation guidance: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/connectAPI_TestingApex.htm
public class ExportOrderSummaryStatusTest {

    //It is not possible to use SeeAllData=true and @TestSetup in the same class. Therefore, each method has to create its own records.
    @isTest
    public static void testOrderSummaryChangeStatus() {
        account acc = new account();
            acc.name = 'Coffe Account';
        insert acc;

        Product2 newProduct = new Product2();
            newProduct.Name = 'Coffe Machine';
            newProduct.ProductCode= '12456';
        insert newProduct;

        Pricebook2 newPricebook = new Pricebook2();
            newPricebook.Name = 'Coffe Machine Pricebook';
            newPricebook.IsActive = true;
        insert newPricebook;

        PricebookEntry[] newPricebookEntry = new PricebookEntry[]{
            new PricebookEntry (Product2ID=newProduct.id,Pricebook2ID= Test.getStandardPricebookId(),UnitPrice=50, isActive=true),
            new PricebookEntry (Product2ID=newProduct.id,Pricebook2ID=newPricebook.id,UnitPrice=50, isActive=true) };
        insert newPricebookEntry;

        Order newOrder = new Order();
            newOrder.Status = 'draft';
            neworder.AccountId = acc.id;
            newOrder.Pricebook2Id = newPricebook.id;
            neworder.EffectiveDate = date.today();
        insert newOrder;

        OrderDeliveryMethod newOrderDeliveryMethod = new OrderDeliveryMethod();
            newOrderDeliveryMethod.Name = 'Test ODM';
            newOrderDeliveryMethod.IsActive = true;
            newOrderDeliveryMethod.ReferenceNumber = '12342';
            newOrderDeliveryMethod.ProductId = newProduct.Id;        
        insert newOrderDeliveryMethod;


        OrderDeliveryGroup orderDeliveryGroup = new OrderDeliveryGroup(
            OrderId = newOrder.id,
            DeliverToName = 'Coffe Delivery',
            OrderDeliveryMethodId = newOrderDeliveryMethod.id
        );
        insert orderDeliveryGroup;

        OrderItem newOrderItem = new OrderItem();
        newOrderItem.OrderId = newOrder.Id;
        newOrderItem.Product2Id = newProduct.Id;
        newOrderItem.PricebookEntryId = newPricebookEntry[1].Id;
        newOrderItem.Quantity = 1;
        newOrderItem.UnitPrice = 10;
        newOrderItem.OrderDeliveryGroupId = orderDeliveryGroup.id;

        insert newOrderItem;

        newOrder.status = 'Activated';
        update newOrder;

        ConnectApi.OrderSummaryInputRepresentation orderSum = new ConnectApi.OrderSummaryInputRepresentation();
            orderSum.orderId= newOrder.id;
            orderSum.orderLifeCycleType='UNMANAGED';
        ConnectApi.OrderSummaryOutputRepresentation orderSumOut = ConnectApi.OrderSummaryCreation.createOrderSummary(orderSum);

        String orderSummaryId = String.ValueOf([SELECT ID FROM OrderSummary LIMIT 1].ID);

        String orderSummaryStatus = String.ValueOf([SELECT ID, Status FROM OrderSummary LIMIT 1].STATUS);

        OrderSummaryExport__c orderExpo = new OrderSummaryExport__c();
            orderExpo.Created_Date__c = datetime.now();
            orderExpo.Export_Attempt_Date_Time__c = datetime.now();
            orderExpo.Export_Attempts_Counter__c = 1;
            orderExpo.Order_Summary_Id__c = orderSummaryId;
            orderExpo.Status__c = 'New';
        insert orderExpo;

        Order_Export_Header_Status_Map__c statusHeader = new Order_Export_Header_Status_Map__c();
            statusHeader.OMS_Status__c = orderSummaryStatus;
            statusHeader.Export_Status__c = '2';
        insert statusHeader;

        OrderItemSummary itemSummary = [Select id,Type, status from OrderItemSummary limit 1];
            itemSummary.type = 'Order Product';
        update itemSummary;

        Order_Export_Line_Status_Map__c orderMap = new Order_Export_Line_Status_Map__c();
            orderMap.OMS_Status__c = itemSummary.status;
            orderMap.Export_Status__c = '2';
        insert orderMap;

        Test.startTest();

        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());
        List<id> idExport = new List<id>();
        idExport.add(orderExpo.id);
        List<ExportOrderSummaryStatus.OutputResource> Resource = ExportOrderSummaryStatus.exportService(idExport);
        system.assertEquals(Resource[0].ErrorCode, '200', 'Integration error');

        Test.stopTest();
    }

    @isTest
    public static void testOrderSummaryChangeStatusExternal() {
        account acc = new account();
            acc.name = 'Coffe Account';
        insert acc;

        Product2 newProduct = new Product2();
            newProduct.Name = 'Coffe Machine';
        insert newProduct;

        Pricebook2 newPricebook = new Pricebook2();
            newPricebook.Name = 'Coffe Machine Pricebook';
            newPricebook.IsActive = true;
        insert newPricebook;

        PricebookEntry[] newPricebookEntry = new PricebookEntry[]{
            new PricebookEntry (Product2ID=newProduct.id,Pricebook2ID= Test.getStandardPricebookId(),UnitPrice=50, isActive=true),
            new PricebookEntry (Product2ID=newProduct.id,Pricebook2ID=newPricebook.id,UnitPrice=50, isActive=true) };
        insert newPricebookEntry;

        Order newOrder = new Order();
            newOrder.Status = 'draft';
            neworder.AccountId = acc.id;
            newOrder.Pricebook2Id = newPricebook.id;
            neworder.EffectiveDate = date.today();
        insert newOrder;

        OrderDeliveryMethod newOrderDeliveryMethod = new OrderDeliveryMethod();
            newOrderDeliveryMethod.Name = 'Test ODM';
            newOrderDeliveryMethod.IsActive = true;
            newOrderDeliveryMethod.ReferenceNumber = '12342';
            newOrderDeliveryMethod.ProductId = newProduct.Id;        
        insert newOrderDeliveryMethod;


        OrderDeliveryGroup orderDeliveryGroup = new OrderDeliveryGroup(
            OrderId = newOrder.id,
            DeliverToName = 'Coffe Delivery',
            OrderDeliveryMethodId = newOrderDeliveryMethod.id
        );
        insert orderDeliveryGroup;

        OrderItem newOrderItem = new OrderItem();
        newOrderItem.OrderId = newOrder.Id;
        newOrderItem.Product2Id = newProduct.Id;
        newOrderItem.PricebookEntryId = newPricebookEntry[1].Id;
        newOrderItem.Quantity = 1;
        newOrderItem.UnitPrice = 10;
        newOrderItem.OrderDeliveryGroupId = orderDeliveryGroup.id;

        insert newOrderItem;

        newOrder.status = 'Activated';
        update newOrder;

        ConnectApi.OrderSummaryInputRepresentation orderSum = new ConnectApi.OrderSummaryInputRepresentation();
            orderSum.orderId= newOrder.id;
            orderSum.orderLifeCycleType='UNMANAGED';
        ConnectApi.OrderSummaryOutputRepresentation orderSumOut = ConnectApi.OrderSummaryCreation.createOrderSummary(orderSum);

        String orderSummaryId = String.ValueOf([SELECT ID FROM OrderSummary LIMIT 1].ID);

        String orderSummaryStatus = String.ValueOf([SELECT ID, Status FROM OrderSummary LIMIT 1].STATUS);

        OrderSummaryExport__c orderExpo = new OrderSummaryExport__c();
            orderExpo.Created_Date__c = datetime.now();
            orderExpo.Export_Attempt_Date_Time__c = datetime.now();
            orderExpo.Export_Attempts_Counter__c = 1;
            orderExpo.Order_Summary_Id__c = orderSummaryId;
            orderExpo.Status__c = 'New';
        insert orderExpo;

        Order_Export_Header_Status_Map__c statusHeader = new Order_Export_Header_Status_Map__c();
            statusHeader.OMS_Status__c = orderSummaryStatus;
            statusHeader.Export_Status__c = '2';
        insert statusHeader;

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());
        List<id> idExport = new List<id>();
        idExport.add(orderExpo.id);
        List<ExportOrderSummaryStatus.OutputResource> Resource = ExportOrderSummaryStatus.exportService(idExport);
        system.assertEquals(Resource[0].ErrorCode, '200', 'Integration error');
        Test.stopTest();
    }
}


