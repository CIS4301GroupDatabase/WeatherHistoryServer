package servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import weatherhistory.server.Config;
import weatherhistory.server.DatabaseService;

@WebServlet(name = "WeatherServlet", urlPatterns = {"/weatherdata"})
public class WeatherServlet extends HttpServlet
{
	private static final long serialVersionUID = 1L;
	private DatabaseService database;
	
	public WeatherServlet()
	{
    	Config config;
		try 
		{
			config = new Config();
	    	DatabaseService databaseservice = new DatabaseService(config);
	    	this.database = databaseservice;
		} 
		catch (IOException e) 
		{
			e.printStackTrace();
			System.out.println("Failed to load config file");
		}

	}
	
	
	@Override
	public void init(ServletConfig config) throws ServletException 
	{
		
		super.init(config);
	}
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
	    response.setContentType("application/json");
	    response.setCharacterEncoding("UTF-8");

		PrintWriter out = response.getWriter();
		if (request.getQueryString() != null && (request.getQueryString().contains("sql") || request.getQueryString().contains("data")))
		{
			String sqlQuery;
			if (request.getQueryString().contains("sql"))
			{
				sqlQuery = request.getParameter("sql");
				sqlQuery = sqlQuery.replace(";", "");
				out.println("SQL Query:");
				out.println(sqlQuery);
				out.println();
				out.println("Result:");
			}
			else
			{
				sqlQuery = request.getParameter("data");
			}
			if (!sqlQuery.isEmpty())
			{
				System.out.println("Connecting to database");
				try 
				{
					Connection connect = database.connectToDatabase();
					System.out.println("Connected to database");
					Statement query = connect.createStatement();
					System.out.println("Sending query");
					ResultSet result = query.executeQuery(sqlQuery);
					
					String json = convertResultSetToJson(result); 
					out.print(json);
					System.out.println("Response recieved, disconnecting from database.");
					database.disconnectFromDatabase(connect);
				} catch (SQLException e) 
				{
					System.out.println("Failed to connect to database or failed sql query");
					e.printStackTrace();
				}
				
			}
		}
		else
		{
			out.println("No query entered. The database can be queried in 2 ways.");
			out.println("To see a page with the origanal query and json with formating; query the database with: /weatherdata?sql=SELECT my FROM query");
			out.println("To get just a straight json string; query the database with: /weatherdata?data=SELECT my FROM query");
		}
	    out.flush();
		out.close();
	}
	
	public String quoteDatesAndTimes(String input)
	{
		String output = input;
		//output = output.re how in the world.
		return output;
	}
	
	@SuppressWarnings("unchecked")	
	public static String convertResultSetToJson(ResultSet resultSet) throws SQLException
	{
		if(resultSet == null)
			return null;
		
		JSONArray json = new JSONArray();
		ResultSetMetaData metadata = resultSet.getMetaData();
		int numColumns = metadata.getColumnCount();
		
		while(resultSet.next()) 			//iterate rows
		{
			JSONObject obj = new JSONObject();		//extends HashMap
			for (int i = 1; i <= numColumns; ++i) 			//iterate columns
			{
				String column_name = metadata.getColumnName(i);
				Object data = resultSet.getObject(column_name);
				if (column_name.contentEquals("CONDITION_DATE") || column_name.contentEquals("CONDITON_DATE") || column_name.contentEquals("SUNRISE_TIME") ||column_name.contentEquals("SUNSET_TIME"))
				{
					Timestamp time = (Timestamp) data;
					String date = time.toString();
					data = date;
				}
				obj.put(column_name, data);
			}
			json.add(obj);
		}
		return json.toJSONString();
	}

}
